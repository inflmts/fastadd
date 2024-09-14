const VALUES_A = [3, 4, 5, 6, 7, 8, 9, 11, 12, 13, 14, 15, 16, 17, 18, 19];
const VALUES_B = [6, 7, 8, 9];

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

const resultCorrectElement = getElement('result-correct');
const resultIncorrectElement = getElement('result-incorrect');
const resultTotalElement = getElement('result-total');
const startButton = getElement('start-button');

const returnButton = getElement('return-button');
const timerElement = getElement('timer');
const statusCorrectElement = getElement('status-correct');
const statusIncorrectElement = getElement('status-incorrect');
const promptElement = getElement('prompt');
const inputElement = getElement('input');
const nextButton = getElement('next-button');

const numberButtons = new Array(10);

function randomSelect(list) {
  return list[Math.floor(Math.random() * list.length)];
}

let isRound = false;
let roundActive;
let roundTime;
let roundPrevTime;
let roundTimeoutID;
let roundCorrect;
let roundIncorrect;
let exerciseCompleted;
let exerciseInput;
let exerciseAnswer;

function startRound() {
  isRound = true;
  roundActive = true;
  roundTime = initialRoundTime;
  roundPrevTime = null;
  roundTimeoutID = null;
  roundCorrect = 0;
  roundIncorrect = 0;
  homeElement.style.display = 'none';
  roundElement.style.display = null;
  statusCorrectElement.textContent = '0';
  statusIncorrectElement.textContent = '0';
  updateTimer();
  startExercise();
}

function endRound() {
  isRound = false;
  if (roundTimeoutID !== null)
    clearTimeout(roundTimeoutID);
  homeElement.style.display = null;
  roundElement.style.display = 'none';
  resultCorrectElement.textContent = roundCorrect;
  resultIncorrectElement.textContent = roundIncorrect;
  resultTotalElement.textContent = roundCorrect + roundIncorrect;
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

function startExercise() {
  const swap = Math.random() < 0.5;
  const a = randomSelect(swap ? VALUES_B : VALUES_A);
  const b = randomSelect(swap ? VALUES_A : VALUES_B);
  promptElement.textContent = `${a} + ${b}`;

  exerciseCompleted = false;
  exerciseInput = '';
  exerciseAnswer = `${a + b}`;

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

function setupButton(button, keys, callback) {
  const activate = () => { button.classList.add('button-active'); if (isRound && roundActive) callback(); };
  const deactivate = () => { button.classList.remove('button-active'); };
  button.addEventListener('pointerdown', activate);
  button.addEventListener('pointerup', deactivate);
  button.addEventListener('pointerleave', deactivate);
  for (const key of keys)
    buttonKeyMap[key] = { activate, deactivate };
}

window.addEventListener('keydown', (ev) => {
  if (!ev.repeat) {
    if (!isRound && ev.code === 'Space')
      startRound();
    else if (isRound && roundActive && ev.code in buttonKeyMap)
      buttonKeyMap[ev.code].activate();
    else if (isRound && ev.code === 'Escape')
      endRound();
  }
});

window.addEventListener('keyup', (ev) => {
  if (isRound && ev.code in buttonKeyMap)
    buttonKeyMap[ev.code].deactivate();
});

for (let n = 0; n < 10; n++) {
  const button = getElement(`number-button-${n}`);
  setupButton(button, [`Digit${n}`, `Numpad${n}`], () => {
    if (!exerciseCompleted)
      inputDigit(n);
  });
  numberButtons[n] = button;
}

setupButton(nextButton, ['Space'], () => {
  if (exerciseCompleted)
    startExercise();
});

startButton.addEventListener('click', () => {
  if (!isRound)
    startRound();
});

returnButton.addEventListener('click', () => {
  if (isRound)
    endRound();
});
