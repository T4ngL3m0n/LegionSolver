import { Point } from './modules/point.js';
import { pieceColours, pieces } from './pieces.js';
import { i18n } from './i18n.js';

let board = JSON.parse(localStorage.getItem("legionBoard"));
if (!board) {
    board = [];
    for (let i = 0; i < 20; i++) {
        board[i] = [];
        for (let j = 0; j < 22; j++) {
            board[i][j] = -1;
        }
    }
}
let activeWorkers = [];
let pieceHistory = [];

const states = {
    START: 'start',
    RUNNING: 'running',
    PAUSED: 'paused',
    COMPLETED: 'completed',
}
let state = states.START;

const legionGroups = [];
for (let i = 0; i < 16; i++) {
    legionGroups[i] = [];
}

document.querySelector('#legionBoard tbody').innerHTML =
    board.map(row => `<tr>${row.map(_ => `<td class="legionCell"></td>`).join('')}</tr>`).join('');

drawBoard();
setLegionGroups();

let boardFilled = 0;
if (localStorage.getItem("boardFilled")) {
    boardFilled = JSON.parse(localStorage.getItem("boardFilled"));
    document.getElementById('boardFilledValue').innerText = `${boardFilled}`;
}

let isBigClick = false;
if (localStorage.getItem("isBigClick")) {
    document.getElementById("bigClick").checked = JSON.parse(localStorage.getItem("isBigClick"));
    if (JSON.parse(localStorage.getItem("isBigClick"))) {
        activateBigClick();
    }
}

let isLiveSolve = false;
if (localStorage.getItem("isLiveSolve")) {
    document.getElementById("liveSolve").checked = JSON.parse(localStorage.getItem("isLiveSolve"));
    if (JSON.parse(localStorage.getItem("isLiveSolve"))) {
        activateLiveSolve();
    }
}

document.getElementById("bigClick").addEventListener("click", activateBigClick);
document.getElementById("liveSolve").addEventListener("click", activateLiveSolve);
document.getElementById("clearBoard").addEventListener("click", clearBoard);
document.getElementById("boardButton").addEventListener("click", handleButton);
document.getElementById("resetButton").addEventListener("click", reset);
document.getElementById("darkMode").addEventListener("click", activateDarkMode);

let dragging = false;
let dragValue;
for (let i = 0; i < board.length; i++) {
    for (let j = 0; j < board[0].length; j++) {
        let grid = getLegionCell(i, j)

        grid.addEventListener("mousedown", () => {
            dragValue = board[i][j] == 0 ? -1 : 0;
            setBoard(i, j, dragValue);
            dragging = true;
        });
        grid.addEventListener("mouseover", () => {
            if (dragging) {
                setBoard(i, j, dragValue);
            } else {
                hoverOverBoard(i, j);
            }
        });
        grid.addEventListener("mouseout", () => {
            if (!dragging) {
                hoverOffBoard(i, j) ;
            }
        });
    }
}
document.documentElement.addEventListener("mouseup", () => { dragging = false });
document.getElementById("legion").addEventListener("dragstart", (evt) => evt.preventDefault());

function setLegionGroups() {
    for (let i = 0; i < board.length / 4; i++) {
        for (let j = i; j < board.length / 2; j++) {
            legionGroups[0].push(new Point(j, i));
            legionGroups[1].push(new Point(i, j + 1))
            legionGroups[2].push(new Point(i, board[0].length - 2 - j))
            legionGroups[3].push(new Point(j, board[0].length - 1 - i))
            legionGroups[4].push(new Point(board.length - 1 - j, board[0].length - 1 - i))
            legionGroups[5].push(new Point(board.length - 1 - i, board[0].length - 2 - j))
            legionGroups[6].push(new Point(board.length - 1 - i, j + 1))
            legionGroups[7].push(new Point(board.length - 1 - j, i))
        }
    }
    for (let i = board.length / 4; i < board.length / 2; i++) {
        for (let j = i; j < board.length / 2; j++) {
            legionGroups[8].push(new Point(j, i));
            legionGroups[9].push(new Point(i, j + 1));
            legionGroups[10].push(new Point(3 * board.length / 4 - 1 - j, board.length / 4 + 1 + i));
            legionGroups[11].push(new Point(j, board[0].length - 1 - i));
            legionGroups[12].push(new Point(board.length - 1 - j, board[0].length - 1 - i));
            legionGroups[13].push(new Point(j + board.length / 4, i + board.length / 4 + 1));
            legionGroups[14].push(new Point(j + board.length / 4, 3 * board.length / 4 - i));
            legionGroups[15].push(new Point(board.length - j - 1, i));
        }
    }
}

function setLegionBorders() {
    for (let i = 0; i < board.length; i++) {
        for (let j = 0; j < board[0].length; j++) {
            getLegionCell(i, j).style.borderWidth = '1px';
        }
    }
    for (let i = 0; i < board[0].length / 2; i++) {
        getLegionCell(i, i).style.borderTopWidth = '3px';
        getLegionCell(i, i).style.borderRightWidth = '3px';
        getLegionCell(board.length - i - 1, i).style.borderBottomWidth = '3px';
        getLegionCell(board.length - i - 1, i).style.borderRightWidth = '3px';
        getLegionCell(i, board[0].length - i - 1).style.borderTopWidth = '3px';
        getLegionCell(i, board[0].length - i - 1).style.borderLeftWidth = '3px';
        getLegionCell(board.length - i - 1, board[0].length - i - 1).style.borderBottomWidth = '3px';
        getLegionCell(board.length - i - 1, board[0].length - i - 1).style.borderLeftWidth = '3px';
    }
    for (let i = 0; i < board.length; i++) {
        getLegionCell(i, 0).style.borderLeftWidth = '3px';
        getLegionCell(i, board[0].length / 2).style.borderLeftWidth = '3px';
        getLegionCell(i, board[0].length - 1).style.borderRightWidth = '3px';
    }
    for (let i = 0; i < board[0].length; i++) {
        getLegionCell(0, i).style.borderTopWidth = '3px';
        getLegionCell(board.length / 2, i).style.borderTopWidth = '3px';
        getLegionCell(board.length - 1, i).style.borderBottomWidth = '3px';
    }
    for (let i = board.length / 4; i < 3 * board.length / 4; i++) {
        getLegionCell(i, Math.floor(board[0].length / 4)).style.borderLeftWidth = '3px';
        getLegionCell(i, Math.floor(3 * board[0].length / 4)).style.borderRightWidth = '3px';
    }
    for (let i = Math.ceil(board[0].length / 4); i < Math.floor(3 * board[0].length / 4); i++) {
        getLegionCell(board.length / 4, i).style.borderTopWidth = '3px';
        getLegionCell(3 * board.length / 4, i).style.borderTopWidth = '3px';
    }
}

let isDarkMode = false;
if (localStorage.getItem("isDarkMode")) {
    document.getElementById("darkMode").checked = JSON.parse(localStorage.getItem("isDarkMode"));
    if (JSON.parse(localStorage.getItem("isDarkMode"))) {
        activateDarkMode();
    }
}


function findGroupNumber(i, j) {
    for (let k = 0; k < legionGroups.length; k++) {
        for (let point of legionGroups[k]) {
            if (point.x == i && point.y == j) {
                return k;
            }
        }
    }
}

function getLegionCell(i, j) {
    return document.getElementById("legionBoard")
    .getElementsByTagName("tr")[i]
    .getElementsByTagName("td")[j];
}

function clearBoard() {
    for (let i = 0; i < board.length; i++) {
        for (let j = 0; j < board[0].length; j++) {
            board[i][j] = -1;
            getLegionCell(i, j).style.background = pieceColours.get(board[i][j])
        }
    }
    boardFilled = 0;
    localStorage.setItem("legionBoard", JSON.stringify(board));
    localStorage.setItem("boardFilled", JSON.stringify(0));
    document.getElementById('boardFilledValue').innerText = `${boardFilled}`;
}

function setBoard(i, j, value) {
    if (state != states.START) {
        return;
    }

    if (isBigClick) {
        if (value == 0) {
            for (let point of legionGroups[findGroupNumber(i, j)]) {
                let grid = getLegionCell(point.x, point.y);
                grid.style.background = pieceColours.get(0);
                if (board[point.x][point.y] == -1) {
                    boardFilled++;
                }
                board[point.x][point.y] = 0;
            }
        } else {
            for (let point of legionGroups[findGroupNumber(i, j)]) {
                let grid = getLegionCell(point.x, point.y);
                grid.style.background = pieceColours.get(-1);
                if (board[point.x][point.y] == 0) {
                    boardFilled--;
                }
                board[point.x][point.y] = -1;
            }
        }
    } else {
        let grid = getLegionCell(i, j);
        if (value == -1) {
            if (board[i][j] != -1) {
                board[i][j] = -1;
                grid.style.background = pieceColours.get(-1);
                boardFilled--;
            }
        } else {
            if (board[i][j] != 0) {
                board[i][j] = 0;
                grid.style.background = pieceColours.get(0);
                boardFilled++;
            }
        }
    }
    localStorage.setItem("legionBoard", JSON.stringify(board));
    localStorage.setItem("boardFilled", JSON.stringify(boardFilled));
    document.getElementById('boardFilledValue').innerText = `${boardFilled}`;
}

function hoverOverBoard(i, j) {
    if (state != states.START) {
        return;
    }
    if (isBigClick) {
        for (let point of legionGroups[findGroupNumber(i, j)]) {
            if (board[point.x][point.y] == -1) {
                if (isDarkMode) {
                    getLegionCell(point.x, point.y).style.background = 'dimgrey';
                } else {
                    getLegionCell(point.x, point.y).style.background = 'silver';
                }
            } else {
                if (isDarkMode) {
                    getLegionCell(point.x, point.y).style.background = 'rgb(20, 20, 20)';
                } else {
                    getLegionCell(point.x, point.y).style.background = 'dimgrey';
                }

            }

        }
    } else {
        if (board[i][j] == -1) {
            if (isDarkMode) {
                getLegionCell(i, j).style.background = 'dimgrey';
            } else {
                getLegionCell(i, j).style.background = 'silver';
            }
        } else {
            if (isDarkMode) {
                getLegionCell(i, j).style.background = 'rgb(20, 20, 20)';
            } else {
                getLegionCell(i, j).style.background = 'dimgrey';
            }
        }

    }
}

function hoverOffBoard(i, j) {
    if (state != states.START) {
        return;
    }
    if (isBigClick) {
        for (let point of legionGroups[findGroupNumber(i, j)]) {
            if (board[point.x][point.y] == -1) {
                getLegionCell(point.x, point.y).style.background = pieceColours.get(-1);
            } else {
                getLegionCell(point.x, point.y).style.background = pieceColours.get(0);
            }
        }
    } else {
        if (board[i][j] == -1) {
            getLegionCell(i, j).style.background = pieceColours.get(-1);
        } else {
            getLegionCell(i, j).style.background = pieceColours.get(0);
        }
    }
}

function resetBoard() {
    for (const w of activeWorkers) w.terminate();
    activeWorkers = [];

    for (let i = 0; i < board.length; i++) {
        for (let j = 0; j < board[0].length; j++) {
            getLegionCell(i, j).style.borderWidth = '1px';
            if (board[i][j] >= 0) {
                getLegionCell(i, j).style.background = pieceColours.get(0);
                board[i][j] = 0;
            }
        }
    }

    setLegionBorders();
}

function drawBoard() {
    setLegionBorders();
    colourBoard();
}

function colourBoard() {
    let spot;
    for (let i = 0; i < board.length; i++) {
        for (let j = 0; j < board[0].length; j++) {
            spot = board[i][j];
            getLegionCell(i, j).style.background = pieceColours.get(spot);
        }
    }

    for (let piece of pieceHistory) {
        for (let i = 0; i < piece.length; i++) {
            if (board[piece[i].y][piece[i].x - 1] > 0 && (getLegionCell(piece[i].y, piece[i].x).style.borderLeftWidth == '3px' || getLegionCell(piece[i].y, piece[i].x - 1).style.borderRightWidth == '3px')) {
                getLegionCell(piece[i].y, piece[i].x).style.borderLeftWidth = '1px';
                getLegionCell(piece[i].y, piece[i].x - 1).style.borderRightWidth = '1px';
            }
            if (board[piece[i].y - 1] && board[piece[i].y - 1][piece[i].x] > 0 && (getLegionCell(piece[i].y, piece[i].x).style.borderTopWidth == '3px' || getLegionCell(piece[i].y - 1, piece[i].x).style.borderBottomWidth == '3px' )) {
                getLegionCell(piece[i].y, piece[i].x).style.borderTopWidth = '1px';
                getLegionCell(piece[i].y - 1, piece[i].x).style.borderBottomWidth = '1px';
            }
            for (let j = 0; j < piece.length; j++) {
                if (i != j && piece[i].x - 1 == piece[j].x && piece[i].y == piece[j].y) {
                    getLegionCell(piece[i].y, piece[i].x).style.borderLeftWidth = '0px';
                    if (board[0][piece[i].x - 1]) {
                        getLegionCell(piece[i].y, piece[i].x - 1).style.borderRightWidth = '0px';
                    }
                }
                if (i != j && piece[i].x == piece[j].x && piece[i].y - 1 == piece[j].y) {
                    getLegionCell(piece[i].y, piece[i].x).style.borderTopWidth = '0px';
                    if (board[piece[i].y - 1]) {
                        getLegionCell(piece[i].y - 1, piece[i].x).style.borderBottomWidth = '0px';
                    }
                }
            }
        }
    }
}

function activateDarkMode() {
    isDarkMode = !isDarkMode;
    localStorage.setItem("isDarkMode", JSON.stringify(isDarkMode));
    let cell;
    let switchTo;
    if (isDarkMode) {
        switchTo = 'white';
        document.getElementById("body").style.backgroundColor = 'rgb(54, 57, 63)';
        for (let i = 0 ; i < pieces.length; i++) {
            document.getElementById(`piece${i+1}`).style.backgroundColor = 'silver';
        }
        pieceColours.set(-1, 'grey');
        pieceColours.set(0, 'rgb(50, 50, 50)');
    } else {
        switchTo = 'black';
        document.getElementById("body").style.backgroundColor = 'white';
        for (let i = 0 ; i < pieces.length; i++) {
            document.getElementById(`piece${i+1}`).style.backgroundColor = 'white';
        }
        pieceColours.set(-1, 'white');
        pieceColours.set(0, 'grey');
    }
    drawBoard();
    for (let i = 0; i < board.length; i++) {
        for (let j = 0; j < board[0].length; j++) {
            cell = getLegionCell(i, j);
            if (cell.style.borderTopColor != switchTo) {
                cell.style.borderTopColor = switchTo
            }
            if (cell.style.borderBottomColor != switchTo) {
                cell.style.borderBottomColor = switchTo
            }
            if (cell.style.borderRightColor != switchTo) {
                cell.style.borderRightColor = switchTo
            }
            if (cell.style.borderLeftColor != switchTo) {
                cell.style.borderLeftColor = switchTo
            }
        }
    }
    document.getElementById("body").style.color = switchTo;
}

function activateBigClick() {
    isBigClick = !isBigClick;
    localStorage.setItem("isBigClick", JSON.stringify(isBigClick));
}

function activateLiveSolve() {
    isLiveSolve = !isLiveSolve;
    localStorage.setItem("isLiveSolve", JSON.stringify(isLiveSolve));
    if (isLiveSolve && state != states.COMPLETED) {
        drawBoard();
    }
}

function reset() {
    resetBoard();
    document.getElementById("clearBoard").disabled = false;
    document.getElementById("boardButton").innerText = i18n("start");
    document.getElementById("resetButton").style.visibility = 'hidden';
    document.getElementById("iterations").style.visibility = 'hidden';
    document.getElementById("time").style.visibility = 'hidden';
    document.getElementById("failText").style.visibility = 'hidden';
    pieceHistory = [];
    state = states.START;
}

async function handleButton(evt) {
    switch (state) {
        case states.START:
            evt.target.innerText = i18n("pause");
            document.getElementById("clearBoard").disabled = true;
            state = states.RUNNING;
            let success = await runSolver();
            if (!success) {
              document.getElementById("failText").style.visibility = 'visible';
            }
            evt.target.innerText = i18n("reset");
            state = states.COMPLETED;
            break;
        case states.RUNNING:
            evt.target.innerText = i18n("continue");
            for (const w of activeWorkers) {
                w.postMessage({ type: 'pause' });
            }
            state = states.PAUSED;
            document.getElementById("resetButton").style.visibility = 'visible';
            break;
        case states.PAUSED:
            evt.target.innerText = i18n("pause");
            pieceHistory = [];
            for (const w of activeWorkers) {
                w.postMessage({ type: 'continue' });
            }
            document.getElementById("iterations").style.visibility = 'hidden';
            document.getElementById("time").style.visibility = 'hidden';
            state = states.RUNNING;
            document.getElementById("resetButton").style.visibility = 'hidden';
            break;
        case states.COMPLETED:
            reset();
            break;
    }
}

async function runSolver() {
    if (boardFilled == 0 && currentPieces > 0) {
        return false;
    }

    let downBoard = [];
    for (let i = 0; i < board.length; i++) {
        downBoard[i] = [];
        for (let j = 0; j < board[0].length; j++) {
            downBoard[i][j] = board[board.length - 1 - i][board[0].length - 1 - j];
        }
    }
    let rightBoard = [];
    for (let i = 0; i < board[0].length; i++) {
        rightBoard[i] = [];
        for (let j = 0; j < board.length; j++) {
            rightBoard[i][j] = board[board.length - j - 1][i];
        }
    }
    let leftBoard = [];
    for (let i = 0; i < board[0].length; i++) {
        leftBoard[i] = [];
        for (let j = 0; j < board.length; j++) {
            leftBoard[i][j] = board[j][board[0].length - 1 - i];
        }
    }

    pieceHistory = [];

    // Serialize pieces as plain objects — Piece class instances cannot be transferred via postMessage
    const plainPieces = pieces.map(p => ({ shape: p.shape, amount: p.amount, id: p.id }));

    const boards = [board, rightBoard, downBoard, leftBoard];

    const workerPromises = boards.map((rotatedBoard, workerIndex) => {
        return new Promise((resolve) => {
            const worker = new Worker(
                new URL('./workers/solver.worker.js', import.meta.url)
            );
            activeWorkers.push(worker);

            worker.onmessage = (e) => {
                const msg = e.data;
                if (msg.type === 'update' && workerIndex === 0) {
                    for (let i = 0; i < board.length; i++)
                        for (let j = 0; j < board[0].length; j++)
                            board[i][j] = msg.board[i][j];
                    pieceHistory = msg.history;
                    onBoardUpdated();
                } else if (msg.type === 'done') {
                    resolve(msg);
                } else if (msg.type === 'stats' && workerIndex === 0) {
                    if (msg.iterations !== 0) {
                        document.getElementById("iterations").style.visibility = 'visible';
                        document.getElementById("iterationsValue").innerText = `${msg.iterations}`;
                        document.getElementById("time").style.visibility = 'visible';
                        document.getElementById("timeValue").innerText = `${msg.elapsed}ms`;
                    }
                }
            };

            worker.postMessage({
                type: 'start',
                data: {
                    board: rotatedBoard,
                    pieces: plainPieces,
                    workerIndex,
                    isPrimary: workerIndex === 0
                }
            });
        });
    });

    const result = await raceToFirstSuccess(workerPromises);

    for (const w of activeWorkers) w.terminate();
    activeWorkers = [];

    if (!result || !result.success) return false;

    const w = result.workerIndex;
    if (w === 0) {
        for (let i = 0; i < result.board.length; i++)
            for (let j = 0; j < result.board[0].length; j++)
                board[i][j] = result.board[i][j];
        pieceHistory = result.history;
    } else if (w === 1) {
        for (let i = 0; i < result.board[0].length; i++)
            for (let j = 0; j < result.board.length; j++)
                board[i][j] = result.board[j][result.board[0].length - 1 - i];
        for (let piece of result.history)
            for (let point of piece) {
                let holder = point.y;
                point.y = result.board[0].length - 1 - point.x;
                point.x = holder;
            }
        pieceHistory = result.history;
    } else if (w === 2) {
        for (let i = 0; i < result.board.length; i++)
            for (let j = 0; j < result.board[0].length; j++)
                board[i][j] = result.board[result.board.length - 1 - i][result.board[0].length - 1 - j];
        for (let piece of result.history)
            for (let point of piece) {
                point.y = result.board.length - 1 - point.y;
                point.x = result.board[0].length - 1 - point.x;
            }
        pieceHistory = result.history;
    } else if (w === 3) {
        for (let i = 0; i < result.board[0].length; i++)
            for (let j = 0; j < result.board.length; j++)
                board[i][j] = result.board[result.board.length - j - 1][i];
        for (let piece of result.history)
            for (let point of piece) {
                let holder = point.x;
                point.x = result.board.length - 1 - point.y;
                point.y = holder;
            }
        pieceHistory = result.history;
    }

    document.getElementById("iterations").style.visibility = 'visible';
    document.getElementById("iterationsValue").innerText = `${result.iterations}`;
    document.getElementById("time").style.visibility = 'visible';
    document.getElementById("timeValue").innerText = `${result.elapsed}ms`;

    drawBoard();
    return true;
}

function raceToFirstSuccess(promises) {
    return new Promise((resolve) => {
        let pending = promises.length;
        for (const p of promises) {
            p.then(result => {
                if (result && result.success) {
                    resolve(result);
                } else {
                    if (--pending === 0) resolve(null);
                }
            });
        }
    });
}

function onBoardUpdated() {
    if (isLiveSolve) {
        drawBoard();
    }
}

export { pieceColours };