import { LegionSolver } from '../modules/legion_solver.js';
import { Piece } from '../modules/piece.js';

let solver = null;

self.onmessage = async function(e) {
    const { type, data } = e.data;

    if (type === 'start') {
        // Reconstruct Piece instances from plain serialized objects
        const pieces = data.pieces.map(p => new Piece(p.shape, p.amount, p.id));

        solver = new LegionSolver(
            data.board,
            pieces,
            () => {
                // onBoardUpdated callback: only primary worker sends live updates
                if (data.isPrimary) {
                    self.postMessage({
                        type: 'update',
                        board: solver.board,
                        history: solver.history
                    });
                }
            }
        );

        const success = await solver.solve();

        if (!solver.shouldStop) {
            self.postMessage({
                type: 'done',
                success,
                workerIndex: data.workerIndex,
                board: solver.board,
                history: solver.history,
                iterations: solver.iterations,
                elapsed: new Date().getTime() - solver.time
            });
        }

    } else if (type === 'pause') {
        if (solver) {
            solver.pause();
            // Send stats so main thread can update the DOM display
            self.postMessage({
                type: 'stats',
                iterations: solver.iterations,
                elapsed: -solver.time  // time is negative (subtracted) when paused
            });
        }
    } else if (type === 'continue') {
        if (solver) solver.continue();
    } else if (type === 'stop') {
        if (solver) solver.stop();
    }
};
