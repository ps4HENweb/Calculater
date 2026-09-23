const expressionEl = document.getElementById('expression');
const resultEl = document.getElementById('result');
const historyEl = document.getElementById('history');
const fractionBox = document.getElementById('fractionBox');
const numInput = document.getElementById('numInput');
const denInput = document.getElementById('denInput');

let expr = '';
let lastAnswer = 0;

function sanitize(exprStr) {
  return exprStr
    .replace(/×/g, '*')
    .replace(/÷/g, '/')
    .replace(/−/g, '-')
    .replace(/π/g, 'Math.PI')
    .replace(/Ans/g, 'lastAnswer')
    .replace(/sqrt\(/g, 'Math.sqrt(');
}

function evalSafe(str) {
  let cleaned = sanitize(str);
  cleaned = cleaned
    .replace(/sin\(/g, 'Math.sin(')
    .replace(/cos\(/g, 'Math.cos(')
    .replace(/tan\(/g, 'Math.tan(')
    .replace(/asin\(/g, 'Math.asin(')
    .replace(/acos\(/g, 'Math.acos(')
    .replace(/atan\(/g, 'Math.atan(')
    .replace(/log\(/g, 'Math.log10(')
    .replace(/ln\(/g, 'Math.log(')
    .replace(/\^2/g, '**2')
    .replace(/\^/g, '**');

  const fn = new Function('lastAnswer', 'return (' + cleaned + ');');
  return fn(lastAnswer);
}

function formatValue(value) {
  if (!Number.isFinite(value)) return 'Error';
  const v = Number(value.toFixed(10));
  return String(v);
}

function updateDisplay() {
  expressionEl.textContent = expr || '0';
  resultEl.textContent = expr ? '' : formatValue(lastAnswer);
}

function appendValue(value) {
  expr += value;
  updateDisplay();
}

function clearAll() {
  expr = '';
  historyEl.textContent = '';
  updateDisplay();
}

function backspace() {
  expr = expr.slice(0, -1);
  updateDisplay();
}

function calculate() {
  if (!expr.trim()) return;

  try {
    const value = evalSafe(expr);
    historyEl.textContent = expr + ' =';
    lastAnswer = value;
    resultEl.textContent = formatValue(value);
    expressionEl.textContent = '0';
    expr = '';
  } catch (err) {
    historyEl.textContent = 'خطأ';
    resultEl.textContent = 'Error';
  }
}

function showFractionBox() {
  fractionBox.classList.add('active');
  numInput.focus();
}

function applyFraction() {
  const num = Number(numInput.value);
  const den = Number(denInput.value);

  if (!num || !den || den === 0) {
    resultEl.textContent = 'خطأ';
    return;
  }

  expr = `(${num})/(${den})`;
  fractionBox.classList.remove('active');
  updateDisplay();
  calculate();
}

document.querySelectorAll('[data-value]').forEach(btn => {
  btn.addEventListener('click', () => appendValue(btn.dataset.value));
});

document.querySelectorAll('[data-action]').forEach(btn => {
  const action = btn.dataset.action;

  btn.addEventListener('click', () => {
    if (action === 'clear') clearAll();
    if (action === 'backspace') backspace();
    if (action === 'equals') calculate();
    if (action === 'ans') appendValue('lastAnswer');
    if (action === 'fraction') showFractionBox();
  });
});

document.getElementById('applyFraction').addEventListener('click', applyFraction);

document.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') calculate();
  if (e.key === 'Backspace') backspace();
  if (e.key === 'Escape') clearAll();

  if (/[0-9+\-*/().%^]/.test(e.key)) {
    appendValue(e.key.replace('*', '×').replace('/', '÷').replace('-', '−'));
  }
});

updateDisplay();
