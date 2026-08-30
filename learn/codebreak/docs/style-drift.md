# Style drift — codebreak

Known deviations from the learn style reference (`../../CLAUDE.md`),
introduced deliberately by the 2026-07-10 board-first UX redesign
(`ux-redesign-report-2026-07-10.md`). Delete entries as they are fixed;
delete this file when the app is conformant.

- **No canvas stage.** The stage is a DOM game board (`.stage-wrap` >
  `.game-board`) on a CSS paper background instead of a `<canvas>`. The
  canvas conventions section does not apply. Precedent: `fractions`
  (`.board-stage` SVG) and `logigate` are also canvas-free. The canvas
  prompt pattern survives as `.stage-prompt` with identical styling.
- **Primary play actions live on the board, not in the panel.** Check,
  Hint, Undo, Clear, Next and the inline feedback card render inside the
  board's `.board-actions` row, deviating from the mission-app panel order
  (task → answer → actions in the panel). The redesign's core requirement
  is that a child solves entirely from the main view; the panel keeps only
  mode toggle, New puzzle, summary, and the Settings disclosure.
- **Board-local scroll surfaces.** Desktop: the clue-card grid
  (`.clue-board`) scrolls internally so slots/tray/actions stay visible —
  the panel is no longer the only scroll container. Mobile: the symbol
  tray scrolls horizontally (`overflow-x: auto`), per the redesign's
  mobile layout. Scrollbars remain unstyled.
- **Sticky mobile actions.** At the mobile breakpoint `.board-actions` is
  `position: sticky; bottom: 0` so Check stays reachable under a long
  clue column.
- **Height media query.** Besides the single width breakpoint, the board
  uses one `@media (max-height: 760px)` rule that tightens the board's
  vertical rhythm (gap/padding) so the densest layout avoids internal clue
  scroll on short windows.
