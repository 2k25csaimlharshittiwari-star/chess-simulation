/**
 * Territory Control & Heatmap Visualizer
 * Analyzes piece attack rays and displays real-time territorial dominance
 */

class ChessHeatmap {
  constructor(engine) {
    this.engine = engine;
    this.enabled = false;
  }

  toggle() {
    this.enabled = !this.enabled;
    return this.enabled;
  }

  /**
   * Calculate attack counts for each square on the 8x8 board
   */
  computeInfluence() {
    const influence = Array(8).fill(null).map(() => 
      Array(8).fill(null).map(() => ({ white: 0, black: 0 }))
    );

    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = this.engine.board[r][c];
        if (!piece) continue;

        const color = piece[0];
        const type = piece[1];
        const isWhite = color === 'w';

        // Pawns
        if (type === 'P') {
          const pawnDir = isWhite ? -1 : 1;
          const targetR = r + pawnDir;
          if (targetR >= 0 && targetR <= 7) {
            if (c - 1 >= 0) isWhite ? influence[targetR][c - 1].white++ : influence[targetR][c - 1].black++;
            if (c + 1 <= 7) isWhite ? influence[targetR][c + 1].white++ : influence[targetR][c + 1].black++;
          }
        }
        // Knights
        else if (type === 'N') {
          const offsets = [
            [-2, -1], [-2, 1], [-1, -2], [-1, 2],
            [1, -2], [1, 2], [2, -1], [2, 1]
          ];
          for (const [dr, dc] of offsets) {
            const nr = r + dr, nc = c + dc;
            if (nr >= 0 && nr <= 7 && nc >= 0 && nc <= 7) {
              isWhite ? influence[nr][nc].white++ : influence[nr][nc].black++;
            }
          }
        }
        // Kings
        else if (type === 'K') {
          const offsets = [
            [-1, -1], [-1, 0], [-1, 1],
            [0, -1],           [0, 1],
            [1, -1],  [1, 0],  [1, 1]
          ];
          for (const [dr, dc] of offsets) {
            const nr = r + dr, nc = c + dc;
            if (nr >= 0 && nr <= 7 && nc >= 0 && nc <= 7) {
              isWhite ? influence[nr][nc].white++ : influence[nr][nc].black++;
            }
          }
        }
        // Sliders (B, R, Q)
        else if (type === 'B' || type === 'R' || type === 'Q') {
          const dirs = [];
          if (type === 'R' || type === 'Q') dirs.push([-1, 0], [1, 0], [0, -1], [0, 1]);
          if (type === 'B' || type === 'Q') dirs.push([-1, -1], [-1, 1], [1, -1], [1, 1]);

          for (const [dr, dc] of dirs) {
            let nr = r + dr, nc = c + dc;
            while (nr >= 0 && nr <= 7 && nc >= 0 && nc <= 7) {
              isWhite ? influence[nr][nc].white++ : influence[nr][nc].black++;
              if (this.engine.board[nr][nc]) break; // Ray terminated
              nr += dr;
              nc += dc;
            }
          }
        }
      }
    }

    return influence;
  }

  /**
   * Apply heatmap styling to square DOM elements
   */
  renderToDOM(boardElement, flipped = false) {
    if (!this.enabled) {
      boardElement.querySelectorAll('.square').forEach(sq => {
        sq.classList.remove('heat-white', 'heat-black', 'heat-contested');
        sq.style.removeProperty('--heat-intensity');
      });
      return;
    }

    const influence = this.computeInfluence();
    const squares = boardElement.querySelectorAll('.square');

    squares.forEach(sq => {
      const r = parseInt(sq.dataset.r, 10);
      const c = parseInt(sq.dataset.c, 10);
      const data = influence[r][c];

      sq.classList.remove('heat-white', 'heat-black', 'heat-contested');

      if (data.white === 0 && data.black === 0) {
        sq.style.removeProperty('--heat-intensity');
        return;
      }

      if (data.white > 0 && data.black > 0) {
        sq.classList.add('heat-contested');
        const intensity = Math.min(0.5, 0.15 + (data.white + data.black) * 0.05);
        sq.style.setProperty('--heat-intensity', intensity);
      } else if (data.white > data.black) {
        sq.classList.add('heat-white');
        const intensity = Math.min(0.48, 0.12 + data.white * 0.08);
        sq.style.setProperty('--heat-intensity', intensity);
      } else {
        sq.classList.add('heat-black');
        const intensity = Math.min(0.48, 0.12 + data.black * 0.08);
        sq.style.setProperty('--heat-intensity', intensity);
      }
    });
  }
}
