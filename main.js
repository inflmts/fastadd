const VALUES = [
  3, 4, 5, 5,
  6, 6, 6, 6, 7, 7, 7, 7, 8, 8, 8, 8, 9, 9, 9,
  11, 11, 12, 12, 13, 13, 14, 14, 15, 16, 17, 18, 19
];

const params = new URLSearchParams(location.search);

const initialRoundTime = (() => {
  const time = Number(params.get('time') ?? NaN);
  return (Number.isNaN(time) ? 60 : time) * 1000;
})();

function getElement(id) {
  const element = document.getElementById(id);
  if (!element)
    throw new Error(`Could not find element #${id}`);
  return element;
}

const homeElement = getElement('home');
const roundElement = getElement('round');
const resultBarElement = getElement('result-bar');
const resultCorrectLineElement = getElement('result-correct-line');
const resultCorrectElement = getElement('result-correct');
const resultIncorrectLineElement = getElement('result-incorrect-line');
const resultIncorrectElement = getElement('result-incorrect');
const resultTotalElement = getElement('result-total');
const timerElement = getElement('timer');
const statusCorrectElement = getElement('status-correct');
const statusIncorrectElement = getElement('status-incorrect');
const promptElement = getElement('prompt');
const inputElement = getElement('input');

function randomSelect(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function randomInt(min, max) {
  return min + Math.floor(Math.random() * (max - min + 1));
}

let isRound = false;
let roundActive;
let roundTime;
let roundPrevTime;
let roundTimeoutID;
let roundCorrect;
let roundIncorrect;
let roundGenerator;
let exerciseCompleted;
let exerciseInput;
let exerciseAnswer;

function startRound(type) {
  isRound = true;
  roundActive = true;
  roundTime = initialRoundTime;
  roundPrevTime = null;
  roundTimeoutID = null;
  roundCorrect = 0;
  roundIncorrect = 0;
  roundGenerator = type;
  homeElement.style.display = 'none';
  roundElement.style.display = null;
  statusCorrectElement.textContent = '0';
  statusIncorrectElement.textContent = '0';
  updateTimer();
  startExercise();
}

function endRound() {
  const total = roundCorrect + roundIncorrect;
  isRound = false;
  if (roundTimeoutID !== null)
    clearTimeout(roundTimeoutID);
  homeElement.style.display = null;
  roundElement.style.display = 'none';
  if (total) {
    resultBarElement.classList.add('enabled');
    resultBarElement.style.setProperty('--progress', `${100 * roundCorrect / total}%`);
    resultCorrectLineElement.classList.toggle('enabled', roundCorrect !== 0);
    resultCorrectElement.textContent = roundCorrect;
    resultIncorrectLineElement.classList.toggle('enabled', roundIncorrect !== 0);
    resultIncorrectElement.textContent = roundIncorrect;
    resultTotalElement.textContent = total;
  }
}

function updateTimer() {
  const currentTime = performance.now();
  if (roundPrevTime !== null)
    roundTime -= currentTime - roundPrevTime;
  roundPrevTime = currentTime;

  if (roundTime <= 0) {
    roundActive = false;
    timerElement.textContent = '0:00';
    inputElement.classList.remove('input-correct', 'input-incorrect', 'input-empty');
    inputElement.classList.add('input-timeout');
    inputElement.textContent = 'TIME';
    roundTimeoutID = setTimeout(endRound, 3000);
  } else {
    let seconds = Math.ceil(roundTime / 1000);
    let minutes = Math.floor(seconds / 60);
    seconds = seconds % 60;
    timerElement.textContent = `${minutes}:${String(seconds).padStart(2, '0')}`;
    roundTimeoutID = setTimeout(updateTimer, roundTime % 1000);
  }
}

function generateExerciseAdd() {
  const a = randomSelect(VALUES);
  const b = randomSelect(VALUES);
  return [`${a} + ${b}`, `${a + b}`];
}

function generateExerciseSub() {
  const a = randomSelect(VALUES);
  const b = randomSelect(VALUES);
  return [`${a + b} \u2212 ${b}`, `${a}`];
}

function startExercise() {
  let prompt, answer;
  do [prompt, answer] = roundGenerator();
  while (prompt === promptElement.textContent);
  promptElement.textContent = prompt;
  exerciseCompleted = false;
  exerciseInput = '';
  exerciseAnswer = answer;
  inputElement.classList.remove('input-correct', 'input-incorrect', 'input-timeout');
  inputElement.classList.add('input-empty');
  inputElement.textContent = '?';
}

function finishExercise(correct) {
  exerciseCompleted = true;
  exerciseInput = undefined;
  exerciseAnswer = undefined;
  inputElement.classList.add(correct ? 'input-correct' : 'input-incorrect');
  if (correct)
    ++roundCorrect;
  else
    ++roundIncorrect;
  statusCorrectElement.textContent = roundCorrect;
  statusIncorrectElement.textContent = roundIncorrect;
}

function inputDigit(digit) {
  digit = digit.toString();
  exerciseInput += digit;
  inputElement.classList.remove('input-empty');
  inputElement.textContent = exerciseInput;

  if (exerciseAnswer[exerciseInput.length - 1] !== digit)
    finishExercise(false);
  else if (exerciseAnswer.length === exerciseInput.length)
    finishExercise(true);
}

////////////////////////////////////////
// Buttons
////////////////////////////////////////

const buttonKeyMap = Object.create(null);

function bindButton(button, keys, callback) {
  if (typeof button === 'string')
    button = getElement(button);
  const activate = () => { button.classList.add('button-active'); callback(); };
  const deactivate = () => { button.classList.remove('button-active'); };
  button.addEventListener('pointerdown', activate);
  button.addEventListener('pointerup', deactivate);
  button.addEventListener('pointerleave', deactivate);
  for (const key of keys)
    buttonKeyMap[key] = { activate, deactivate };
}

window.addEventListener('keydown', (ev) => {
  if (!ev.repeat && ev.code in buttonKeyMap)
    buttonKeyMap[ev.code].activate();
});

window.addEventListener('keyup', (ev) => {
  if (ev.code in buttonKeyMap)
    buttonKeyMap[ev.code].deactivate();
});

for (let n = 0; n < 10; n++) {
  bindButton(`number-button-${n}`, [`Digit${n}`, `Numpad${n}`], () => {
    if (isRound && roundActive && !exerciseCompleted)
      inputDigit(n);
  });
}

bindButton('next-button', ['Space'], () => {
  if (!isRound)
    startRound(generateExerciseAdd);
  else if (roundActive && exerciseCompleted)
    startExercise();
});

bindButton('start-add', ['KeyA'], () => {
  if (!isRound)
    startRound(generateExerciseAdd);
});

bindButton('start-sub', ['KeyS'], () => {
  if (!isRound)
    startRound(generateExerciseSub);
});

bindButton('return-button', ['Escape'], () => {
  if (isRound)
    endRound();
});
