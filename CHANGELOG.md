# Changelog

## [Unreleased] - 2026-04-06

### Added
- 新增 `src/workers/solver.worker.js`：將 `LegionSolver` 的求解運算移至 Web Worker，避免阻塞主線程 UI
- 新增 `raceToFirstSuccess()` 輔助函數：取代原本的 `Promise.race()`，只解析第一個**成功**的 Worker 結果（而非最快完成的）

### Changed
- **架構重構：主線程改用 Web Worker 並行求解**
  - `legionSolvers[]` 陣列重命名為 `activeWorkers[]`，存放 `Worker` 實例
  - 主線程與 Worker 間透過 `postMessage` 傳遞指令（`start` / `pause` / `continue` / `stop`）
  - Worker 回傳三種訊息類型：`update`（即時棋盤更新）、`done`（求解完成）、`stats`（統計資訊）
  - `Piece` 類別實例序列化為 plain objects 後傳入 Worker，Worker 端再重建實例（解決 `postMessage` 無法傳遞 class 實例的問題）
- **`resetBoard()` 重構**：先呼叫 `w.terminate()` 終止所有活躍 Worker，再清空 UI 狀態；簡化巢狀迴圈，直接操作主 `board` 陣列
- **暫停/繼續流程調整**：繼續求解（`PAUSED → RUNNING`）時，主線程隱藏迭代次數與時間顯示，改由 Worker 的 `stats` 訊息觸發顯示
- **`LegionSolver.pause()` / `continue()` 清理**：移除其中的 DOM 操作，DOM 控制邏輯集中回主線程處理

### Removed
- `board.js` 移除對 `LegionSolver` 的直接 import（改由 Worker 內部引用）
- `legion_solver.js` 的 `pause()` 與 `continue()` 中移除 `iterations`、`time` 等 DOM 元素操作
- `colourBoard()` 中移除從 `legionSolvers[0].history` 同步 `pieceHistory` 的邏輯
