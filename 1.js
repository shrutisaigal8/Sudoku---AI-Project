const board = document.getElementById("board");
const movesSpan = document.getElementById("movesLeft");
const timerSpan = document.getElementById("timer");
const difficultySelect = document.getElementById("difficulty");
const errorSound = document.getElementById("errorSound");
const winSound = document.getElementById("winSound");
const loseSound = document.getElementById("loseSound");

let puzzle = [];
let initialPuzzle = [];
let gridSize = 4;
let movesLeft = 0;
let timer;
let totalseconds = 0;

// --- SAMPLE PUZZLES ---
const puzzles = {
  "easy": [
    [1, 0, 0, 4],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [2, 0, 0, 3]
  ],
  "medium": [
    [0,0,0,2,0,0],
    [3,0,0,0,0,1],
    [0,0,1,0,0,0],
    [0,0,0,6,0,0],
    [6,0,0,0,0,5],
    [0,0,0,3,0,0]
  ],
  "hard": [
    [6,2,0,5,0,3],
    [0,0,0,0,0,0],
    [5,0,0,0,3,0],
    [0,6,0,0,2,0],
    [0,0,0,3,4,6],
    [3,0,6,0,0,0]
  ]
};

// --- TIMER ---
let totalSeconds = 0; // remaining seconds

function startTimer() {
  clearInterval(timer);

  // Set starting time based on difficulty
  const level = difficultySelect.value;
  switch(level) {
    case "easy": totalSeconds = 2 * 60; break;    // 2 mins
    case "medium": totalSeconds = 5 * 60; break;  // 5 mins
    case "hard": totalSeconds = 10 * 60; break;   // 10 mins
  }

  // Display initial time
  updateTimerDisplay();

  // Countdown interval
  timer = setInterval(() => {
    totalSeconds--;
    updateTimerDisplay();

    if (totalSeconds <= 0) {
      clearInterval(timer);
       loseSound.currentTime = 0;
       loseSound.play();
      showModal("Time's up! ⏰");
    }
  }, 1000);
}


// Update the timer display in mm:ss
function updateTimerDisplay() {
  const m = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
  const s = String(totalSeconds % 60).padStart(2, '0');
  timerSpan.innerText = `Time: ${m}:${s}`;
}

// Stop the timer if needed
function stopTimer() {
  clearInterval(timer);
}



function stopTimer() {
  clearInterval(timer);
}

// --- DIFFICULTY SETTINGS ---
function setDifficulty() {
  const level = difficultySelect.value;
  switch(level) {
    case "easy":
      gridSize = 4;
      movesLeft = 20;
      break;
    case "medium":
      gridSize = 6;
      movesLeft = 35;
      break;
    case "hard":
      gridSize = 6;
      movesLeft = 50;
      break;
  }
  movesSpan.innerText = `Moves Left: ${movesLeft}`;
  initialPuzzle = JSON.parse(JSON.stringify(puzzles[level]));
  puzzle = JSON.parse(JSON.stringify(initialPuzzle));
}

// --- START GAME ---
function startGame() {
  setDifficulty();
  drawBoard();
  startTimer();
}

// --- DRAW BOARD ---

function drawBoard() {
  board.innerHTML = "";
  board.style.gridTemplateColumns = `repeat(${gridSize}, 60px)`;
  board.style.gridTemplateRows = `repeat(${gridSize}, 60px)`;
  for (let r = 0; r < gridSize; r++) {
    for (let c = 0; c < gridSize; c++) {
      const cell = document.createElement("input");
      cell.type = "text";
      cell.maxLength = 1;
      cell.value = puzzle[r][c] === 0 ? "" : puzzle[r][c];
      cell.className = "cell";
      cell.classList.remove("invalid");

      if (initialPuzzle[r][c] !== 0) {
        cell.classList.add("prefilled");
        cell.readOnly = true;
      } else {
        let previousValue = ""; // Track last input to prevent multiple deductions

        cell.addEventListener("input", () => {
          const currentValue = cell.value.trim();

          if (currentValue === "") {
            puzzle[r][c] = 0;
            cell.classList.remove("invalid");
            return;
          }

          // If same as last input, skip move deduction
          if (currentValue === previousValue) return;

          const val = parseInt(currentValue);

          if (!isNaN(val) && val >= 1 && val <= gridSize) {
            if (movesLeft <= 0) return;

            movesLeft--;
            movesSpan.innerText = `Moves Left: ${movesLeft}`;
            puzzle[r][c] = val;
            cell.classList.remove("invalid");

            if (!isValid(val, r, c)) {
              cell.classList.add("invalid");
              errorSound.currentTime = 0;
              errorSound.play();
              errorInputSound.currentTime = 0;
              errorInputSound.play();

            }

            previousValue = currentValue;
          } else {
            // It's invalid input (e.g., "a" or "9" in 4x4)
            if (movesLeft <= 0) return;

            movesLeft--;
            movesSpan.innerText = `Moves Left: ${movesLeft}`;
            puzzle[r][c] = 0;
            if (cell.value !== "") {
              cell.classList.add("invalid");
              errorSound.currentTime = 0;
              errorSound.play();
              errorInputSound.currentTime = 0;
              errorInputSound.play();

            }

            previousValue = currentValue;
          }

          // Check win or lose
          if (isBoardComplete() && isBoardValid()) {
            stopTimer();
            showModal("YOU'RE A WINNER! 🎉");
          } else if (movesLeft === 0) {
            stopTimer();
            loseSound.currentTime = 0;
            loseSound.play();
            showModal("Out of moves! 😢");
          }
        });
      }

      board.appendChild(cell);
    }
  }
}

// --- VALIDATION ---
function isValid(num,row,col){
  for(let c=0;c<gridSize;c++){
    if(c!==col && puzzle[row][c]===num) return false;
  }
  for(let r=0;r<gridSize;r++){
    if(r!==row && puzzle[r][col]===num) return false;
  }

  // Blocks: 2x2 for 4x4, 2x3 for 6x6
  let blockRows = gridSize===4?2:2;
  let blockCols = gridSize===4?2:3;
  const startRow=Math.floor(row/blockRows)*blockRows;
  const startCol=Math.floor(col/blockCols)*blockCols;

  for(let r=startRow;r<startRow+blockRows;r++){
    for(let c=startCol;c<startCol+blockCols;c++){
      if((r!==row || c!==col) && puzzle[r][c]===num) return false;
    }
  }
  return true;
}

function isBoardComplete(){
  for(let r=0;r<gridSize;r++)
    for(let c=0;c<gridSize;c++)
      if(puzzle[r][c]===0) return false;
  return true;
}

function isBoardValid(){
  for(let r=0;r<gridSize;r++)
    for(let c=0;c<gridSize;c++){
      if(puzzle[r][c]===0) return false;
      if(!isValid(puzzle[r][c],r,c)) return false;
    }
  return true;
}

// --- SOLVE ---
// --- SOLVE (Animated) ---
async function solveSudoku() {
  stopTimer(); // Pause the timer while solving

  async function backtrack() {
    for (let row = 0; row < gridSize; row++) {
      for (let col = 0; col < gridSize; col++) {
        if (puzzle[row][col] === 0) {
          for (let num = 1; num <= gridSize; num++) {
            if (isValid(num, row, col)) {
              puzzle[row][col] = num;
              drawBoard();
              highlightCell(row, col);
              await delay(50); // speed of solving animation

              if (await backtrack()) return true;

              puzzle[row][col] = 0; // backtrack
              drawBoard();
              highlightCell(row, col);
              await delay(50);
            }
          }
          return false;
        }
      }
    }
    return true; // Solved
  }

  function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  const solved = await backtrack();

  if (solved) {
    drawBoard();
    showModal("Puzzle Solved!");
  } else {
    showModal("No solution found!");
  }
}

// --- RESET ---
function resetBoard(){
  puzzle = JSON.parse(JSON.stringify(initialPuzzle));
  drawBoard();
  setDifficulty();
  startTimer();
}

// --- MODAL ---
function showModal(message){
  document.getElementById("modalText").innerText=message;
  document.getElementById("customModal").style.display="flex";
  if(message.includes("WINNER")){
    winSound.currentTime=0;
    winSound.play();
  }
}
function closeModal(){ document.getElementById("customModal").style.display="none"; }
// --- HIGHLIGHTING HELPER ---
function highlightCell(row, col) {
  const index = row * gridSize + col;
  const cells = board.querySelectorAll(".cell");
  cells.forEach(cell => cell.classList.remove("highlight"));
  if (cells[index]) {
    cells[index].classList.add("highlight");
  }
}

startGame();
