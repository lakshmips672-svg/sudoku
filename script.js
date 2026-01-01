document.addEventListener('DOMContentLoaded', () => {
    const boardElement = document.getElementById('sudoku-board');
    const numpadElement = document.getElementById('numpad');
    const timerElement = document.getElementById('timer');
    const difficultySelect = document.getElementById('difficulty');
    const notesBtn = document.getElementById('notes-btn');
    const resetBtn = document.getElementById('reset-btn');
    const newGameBtn = document.getElementById('new-game-btn');
    const winMessage = document.getElementById('win-message');

    let board = [];
    let solution = [];
    let selectedCell = null;
    let notesMode = false;
    let timerInterval;
    let time = 0;

    function generateSudoku(difficulty) {
        // Create an empty 9x9 board
        board = Array(9).fill(null).map(() => Array(9).fill(0));
        solution = Array(9).fill(null).map(() => Array(9).fill(0));

        // Fill the board with a valid Sudoku solution
        solveSudoku(board);
        for (let i = 0; i < 9; i++) {
            for (let j = 0; j < 9; j++) {
                solution[i][j] = board[i][j];
            }
        }

        // Remove numbers to create the puzzle
        let emptyCells;
        if (difficulty === 'easy') {
            emptyCells = 40;
        } else if (difficulty === 'medium') {
            emptyCells = 50;
        } else {
            emptyCells = 60;
        }

        for (let i = 0; i < emptyCells; i++) {
            let row, col;
            do {
                row = Math.floor(Math.random() * 9);
                col = Math.floor(Math.random() * 9);
            } while (board[row][col] === 0);
            board[row][col] = 0;
        }
    }

    function solveSudoku(grid) {
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                if (grid[row][col] === 0) {
                    const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9];
                    shuffle(numbers);
                    for (const num of numbers) {
                        if (isValid(grid, row, col, num)) {
                            grid[row][col] = num;
                            if (solveSudoku(grid)) {
                                return true;
                            }
                            grid[row][col] = 0;
                        }
                    }
                    return false;
                }
            }
        }
        return true;
    }

    function isValid(grid, row, col, num) {
        for (let i = 0; i < 9; i++) {
            if (grid[row][i] === num || grid[i][col] === num) {
                return false;
            }
        }

        const startRow = Math.floor(row / 3) * 3;
        const startCol = Math.floor(col / 3) * 3;
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                if (grid[startRow + i][startCol + j] === num) {
                    return false;
                }
            }
        }
        return true;
    }

    function shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    function renderBoard() {
        boardElement.innerHTML = '';
        for (let i = 0; i < 9; i++) {
            for (let j = 0; j < 9; j++) {
                const cell = document.createElement('div');
                cell.classList.add('cell');
                cell.dataset.row = i;
                cell.dataset.col = j;
                if (board[i][j] !== 0) {
                    cell.textContent = board[i][j];
                    cell.classList.add('fixed');
                }
                boardElement.appendChild(cell);
            }
        }
    }

    function renderNumpad() {
        numpadElement.innerHTML = '';
        for (let i = 1; i <= 9; i++) {
            const btn = document.createElement('button');
            btn.textContent = i;
            btn.classList.add('numpad-btn');
            numpadElement.appendChild(btn);
        }
    }

    function startTimer() {
        clearInterval(timerInterval);
        time = 0;
        timerInterval = setInterval(() => {
            time++;
            const minutes = Math.floor(time / 60).toString().padStart(2, '0');
            const seconds = (time % 60).toString().padStart(2, '0');
            timerElement.textContent = `${minutes}:${seconds}`;
        }, 1000);
    }

    function selectCell(row, col) {
        if (selectedCell) {
            selectedCell.classList.remove('selected');
            highlight(selectedCell.dataset.row, selectedCell.dataset.col, false);
        }
        selectedCell = boardElement.querySelector(`[data-row='${row}'][data-col='${col}']`);
        selectedCell.classList.add('selected');
        highlight(row, col, true);
    }

    function highlight(row, col, state) {
        row = parseInt(row);
        col = parseInt(col);
        for (let i = 0; i < 9; i++) {
            const rCell = boardElement.querySelector(`[data-row='${row}'][data-col='${i}']`);
            const cCell = boardElement.querySelector(`[data-row='${i}'][data-col='${col}']`);
            if (state) {
                rCell.classList.add('highlight');
                cCell.classList.add('highlight');
            } else {
                rCell.classList.remove('highlight');
                cCell.classList.remove('highlight');
            }
        }
        const startRow = Math.floor(row / 3) * 3;
        const startCol = Math.floor(col / 3) * 3;
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                const bCell = boardElement.querySelector(`[data-row='${startRow + i}'][data-col='${startCol + j}']`);
                if (state) {
                    bCell.classList.add('highlight');
                } else {
                    bCell.classList.remove('highlight');
                }
            }
        }
    }

    function handleInput(num) {
        if (!selectedCell || selectedCell.classList.contains('fixed')) {
            return;
        }

        const row = selectedCell.dataset.row;
        const col = selectedCell.dataset.col;

        if (notesMode) {
            let note = selectedCell.querySelector('.note');
            if (!note) {
                note = document.createElement('div');
                note.classList.add('note');
                selectedCell.appendChild(note);
            }
            if (note.textContent.includes(num)) {
                note.textContent = note.textContent.replace(num, '');
            } else {
                note.textContent += num;
            }
        } else {
            selectedCell.textContent = num;
            board[row][col] = parseInt(num);
            validateCell(row, col, num);
            checkWin();
        }
    }

    function validateCell(row, col, num) {
        row = parseInt(row);
        col = parseInt(col);
        num = parseInt(num);
        let conflict = false;

        // Check row and column
        for (let i = 0; i < 9; i++) {
            if (i !== col) {
                const rCell = boardElement.querySelector(`[data-row='${row}'][data-col='${i}']`);
                if (parseInt(rCell.textContent) === num) {
                    rCell.classList.add('conflicting');
                    conflict = true;
                }
            }
            if (i !== row) {
                const cCell = boardElement.querySelector(`[data-row='${i}'][data-col='${col}']`);
                if (parseInt(cCell.textContent) === num) {
                    cCell.classList.add('conflicting');
                    conflict = true;
                }
            }
        }

        // Check 3x3 box
        const startRow = Math.floor(row / 3) * 3;
        const startCol = Math.floor(col / 3) * 3;
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                const bRow = startRow + i;
                const bCol = startCol + j;
                if (bRow !== row && bCol !== col) {
                    const bCell = boardElement.querySelector(`[data-row='${bRow}'][data-col='${bCol}']`);
                    if (parseInt(bCell.textContent) === num) {
                        bCell.classList.add('conflicting');
                        conflict = true;
                    }
                }
            }
        }

        if (conflict) {
            selectedCell.classList.add('conflicting');
        } else {
            selectedCell.classList.remove('conflicting');
        }
    }
    
    function checkWin() {
        for (let i = 0; i < 9; i++) {
            for (let j = 0; j < 9; j++) {
                if (board[i][j] === 0 || board[i][j] !== solution[i][j]) {
                    return;
                }
            }
        }
        clearInterval(timerInterval);
        winMessage.classList.remove('hidden');
    }

    function newGame() {
        generateSudoku(difficultySelect.value);
        renderBoard();
        startTimer();
        winMessage.classList.add('hidden');
    }
    
    function resetGame() {
        renderBoard();
        startTimer();
    }

    boardElement.addEventListener('click', (e) => {
        if (e.target.classList.contains('cell')) {
            const row = e.target.dataset.row;
            const col = e.target.dataset.col;
            selectCell(row, col);
        }
    });

    numpadElement.addEventListener('click', (e) => {
        if (e.target.classList.contains('numpad-btn')) {
            const num = e.target.textContent;
            handleInput(num);
        }
    });

    document.addEventListener('keydown', (e) => {
        if (e.key >= '1' && e.key <= '9') {
            handleInput(e.key);
        }
    });

    notesBtn.addEventListener('click', () => {
        notesMode = !notesMode;
        notesBtn.classList.toggle('active', notesMode);
    });

    resetBtn.addEventListener('click', resetGame);
    newGameBtn.addEventListener('click', newGame);
    difficultySelect.addEventListener('change', newGame);

    renderNumpad();
    newGame();
});