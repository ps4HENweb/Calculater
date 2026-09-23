const expressionEl = document.getElementById('expression');
const resultEl = document.getElementById('result');
const historyEl = document.getElementById('history');
const scientificPad = document.getElementById('scientificPad');
const fractionBox = document.getElementById('fractionBox');
const numeratorEl = document.getElementById('numerator');
const denominatorEl = document.getElementById('denominator');

let expr = '';
let lastAnswer = 0;
let angleMode = 'DEG';
let currentMode = 'basic';

function updateDisplay() {
  expressionEl.textContent = expr || '0';
  resultEl.textContent = expr ? '' : formatValue(lastAnswer);
}

function formatValue(value) {
  if (!Number.isFinite(value)) return 'Error';
  const rounded = Number(value.toFixed(10));
  return String(rounded);
}

function cleanExpression(raw) {
  return raw
    .replace(/×/g, '*')
    .replace(/÷/g, '/')
    .replace(/−/g, '-')
    .replace(/π/g, 'PI')
    .replace(/√/g, 'sqrt')
    .replace(/Ans/g, 'lastAnswer');
}

function factorial(n) {
  if (n < 0 || n % 1 !== 0) return NaN;
  let res = 1;
  for (let i = 2; i <= n; i++) res *= i;
  return res;
}

function safeEval(formula) {
  const normalized = cleanExpression(formula).replace(/\s+/g, '');
  const tokens = normalized.match(/[0-9]+(?:\.[0-9]+)?|\.|\+|\-|\*|\/|\^|\(|\)|sin|cos|tan|asin|acos|atan|log|ln|sqrt|PI|lastAnswer|!|%/gi);

  if (!tokens || tokens.length === 0) return 0;

  const toRadians = (deg) => angleMode === 'DEG' ? (deg * Math.PI) / 180 : deg;

  const parseExpression = () => {
    let index = 0;

    function parseAddSubtract() {
      let value = parseMultiplyDivide();
      while (index < tokens.length && (tokens[index] === '+' || tokens[index] === '-')) {
        const op = tokens[index++];
        const rhs = parseMultiplyDivide();
        value = op === '+' ? value + rhs : value - rhs;
      }
      return value;
    }

    function parseMultiplyDivide() {
      let value = parsePower();
      while (index < tokens.length && (tokens[index] === '*' || tokens[index] === '/')) {
        const op = tokens[index++];
        const rhs = parsePower();
        if (op === '/' && rhs === 0) throw new Error('لا يمكن القسمة على صفر');
        value = op === '*' ? value * rhs : value / rhs;
      }
      return value;
    }

    function parsePower() {
      let value = parseUnary();
      while (index < tokens.length && tokens[index] === '^') {
        index++;
        const exp = parseUnary();
        value = Math.pow(value, exp);
      }
      return value;
    }

    function parseUnary() {
      if (index < tokens.length && tokens[index] === '-') {
        index++;
        return -parseUnary();
      }

      if (index < tokens.length && tokens[index] === '+') {
        index++;
        return parseUnary();
      }

      return parsePrimary();
    }

    function parsePrimary() {
      if (index >= tokens.length) throw new Error('تعبير غير كامل');

      const token = tokens[index];
      if (/^\d+(?:\.\d+)?$/.test(token)) {
        index++;
        return Number(token);
      }

      const fnMap = {
        sin: (v) => Math.sin(toRadians(v)),
        cos: (v) => Math.cos(toRadians(v)),
        tan: (v) => Math.tan(toRadians(v)),
        asin: (v) => Math.asin(v) * (angleMode === 'DEG' ? 180 / Math.PI : 1),
        acos: (v) => Math.acos(v) * (angleMode === 'DEG' ? 180 / Math.PI : 1),
        atan: (v) => Math.atan(v) * (angleMode === 'DEG' ? 180 / Math.PI : 1),
        log: (v) => Math.log10(v),
        ln: (v) => Math.log(v),
        sqrt: (v) => Math.sqrt(v),
        PI: () => Math.PI,
        lastAnswer: () => lastAnswer,
      };

      if (token.toLowerCase() in fnMap) {
        index++;
        const name = token.toLowerCase();

        if (name === 'pi' || name === 'lastanswer') {
          return fnMap[name]();
        }

        if (tokens[index] === '(') {
          index++;
          const arg = parseAddSubtract();
          if (tokens[index] !== ')') throw new Error('قوس غير مكتمل');
          index++;
          return fnMap[name](arg);
        }

        const arg = parseUnary();
        return fnMap[name](arg);
      }

      if (token === '(') {
        index++;
        const value = parseAddSubtract();
        if (tokens[index] !== ')') throw new Error('قوس غير مكتمل');
        index++;
        return value;
      }

      if (token === '!') {
        index++;
        return factorial(parsePrimary());
      }

      if (token === '%') {
        index++;
        return parsePrimary() / 100;
      }

      throw new Error('رمز غير صحيح');
    }

    const result = parseAddSubtract();
    if (index !== tokens.length) {
      throw new Error('تعبير غير صحيح');
    }
    return result;
  };

  return parseExpression();
}

function calculate() {
  if (!expr.trim()) return;

  try {
    const value = safeEval(expr);
    historyEl.textContent = `${expr} =`;
    lastAnswer = value;
    expr = '';
    resultEl.textContent = formatValue(value);
    expressionEl.textContent = '0';
  } catch (error) {
    historyEl.textContent = 'خطأ';
    resultEl.textContent = String(error.message || 'خطأ');
    expressionEl.textContent = expr;
  }
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

function applyFraction() {
  const n = Number(numeratorEl.value);
  const d = Number(denominatorEl.value);

  if (!Number.isFinite(n) || !Number.isFinite(d) || d === 0) {
    resultEl.textContent = 'أدخل بسط ومقام صحيحين';
    return;
  }

  expr = `(${n})/(${d})`;
  fractionBox.classList.add('hidden');
  updateDisplay();
  calculate();
}

function toggleMode(mode) {
  currentMode = mode;
  document.querySelectorAll('.mode').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.mode === mode);
  });

  const showScience = mode === 'scientific';
  scientificPad.classList.toggle('hidden', !showScience);

  if (mode === 'fraction') {
    fractionBox.classList.remove('hidden');
    numeratorEl.focus();
  } else {
    fractionBox.classList.add('hidden');
  }
}

function handleKey(key) {
  if (/^[0-9]$/.test(key) || ['.', '+', '-', '*', '/', '(', ')', '^', '%', 'π', 'e'].includes(key)) {
    appendValue(key.replace('*', '×').replace('/', '÷').replace('-', '−'));
  }
}

document.querySelectorAll('[data-value]').forEach((button) => {
  button.addEventListener('click', () => {
    const value = button.dataset.value;
    if (value === '^2') {
      appendValue('^2');
      return;
    }
    appendValue(value);
  });
});

document.querySelectorAll('[data-action]').forEach((button) => {
  const action = button.dataset.action;
  button.addEventListener('click', () => {
    if (action === 'clear') clearAll();
    if (action === 'backspace') backspace();
    if (action === 'equals') calculate();
    if (action === 'ans') appendValue('Ans');
    if (action === 'fraction') {
      toggleMode('fraction');
      fractionBox.classList.remove('hidden');
      numeratorEl.focus();
    }
  });
});

document.getElementById('applyFraction').addEventListener('click', applyFraction);
document.querySelectorAll('.mode').forEach((btn) => {
  btn.addEventListener('click', () => toggleMode(btn.dataset.mode));
});

document.addEventListener('keydown', (event) => {
  const key = event.key;
  if (key === 'Enter') calculate();
  else if (key === 'Backspace') backspace();
  else if (key === 'Escape') clearAll();
  else if (key === ' ') event.preventDefault();
  else if (/[0-9\.+\-\*\/\(\)^%]/.test(key)) {
    event.preventDefault();
    appendValue(key.replace('*', '×').replace('/', '÷').replace('-', '−'));
  }
});

updateDisplay();
