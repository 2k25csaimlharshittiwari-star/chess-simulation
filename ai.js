/**
 * Chess AI and Evaluation Engine
 * Minimax with Alpha-Beta Pruning, Quiescence Search, MVV-LVA move ordering,
 * and Piece-Square Table (PST) positional evaluation.
 */

const PIECE_VALUES = {
  P: 100,
  N: 320,
  B: 335,
  R: 500,
  Q: 925,
  K: 20000
};

// Piece-Square Tables (from White's perspective; mirrored for Black)
const PST = {
  P: [
    [  0,   0,   0,   0,   0,   0,   0,   0],
    [ 50,  50,  50,  50,  50,  50,  50,  50],
    [ 10,  10,  20,  30,  30,  20,  10,  10],
    [  5,   5,  10,  25,  25,  10,   5,   5],
    [  0,   0,   0,  20,  20,   0,   0,   0],
    [  5,  -5, -10,   0,   0, -10,  -5,   5],
    [  5,  10,  10, -20, -20,  10,  10,   5],
    [  0,   0,   0,   0,   0,   0,   0,   0]
  ],
  N: [
    [-50, -40, -30, -30, -30, -30, -40, -50],
    [-40, -20,   0,   0,   0,   0, -20, -40],
    [-30,   0,  10,  15,  15,  10,   0, -30],
    [-30,   5,  15,  20,  20,  15,   5, -30],
    [-30,   0,  15,  20,  20,  15,   0, -30],
    [-30,   5,  10,  15,  15,  10,   5, -30],
    [-40, -20,   0,   5,   5,   0, -20, -40],
    [-50, -40, -30, -30, -30, -30, -40, -50]
  ],
  B: [
    [-20, -10, -10, -10, -10, -10, -10, -20],
    [-10,   0,   0,   0,   0,   0,   0, -10],
    [-10,   0,   5,  10,  10,   5,   0, -10],
    [-10,   5,   5,  10,  10,   5,   5, -10],
    [-10,   0,  10,  10,  10,  10,   0, -10],
    [-10,  10,  10,  10,  10,  10,  10, -10],
    [-10,   5,   0,   0,   0,   0,   5, -10],
    [-20, -10, -10, -10, -10, -10, -10, -20]
  ],
  R: [
    [  0,   0,   0,   0,   0,   0,   0,   0],
    [  5,  10,  10,  10,  10,  10,  10,   5],
    [ -5,   0,   0,   0,   0,   0,   0,  -5],
    [ -5,   0,   0,   0,   0,   0,   0,  -5],
    [ -5,   0,   0,   0,   0,   0,   0,  -5],
    [ -5,   0,   0,   0,   0,   0,   0,  -5],
    [ -5,   0,   0,   0,   0,   0,   0,  -5],
    [  0,   0,   0,   5,   5,   0,   0,   0]
  ],
  Q: [
    [-20, -10, -10,  -5,  -5, -10, -10, -20],
    [-10,   0,   0,   0,   0,   0,   0, -10],
    [-10,   0,   5,   5,   5,   5,   0, -10],
    [ -5,   0,   5,   5,   5,   5,   0,  -5],
    [  0,   0,   5,   5,   5,   5,   0,  -5],
    [-10,   5,   5,   5,   5,   5,   0, -10],
    [-10,   0,   5,   0,   0,   0,   0, -10],
    [-20, -10, -10,  -5,  -5, -10, -10, -20]
  ],
  K: [
    [-30, -40, -40, -50, -50, -40, -40, -30],
    [-30, -40, -40, -50, -50, -40, -40, -30],
    [-30, -40, -40, -50, -50, -40, -40, -30],
    [-30, -40, -40, -50, -50, -40, -40, -30],
    [-20, -30, -30, -40, -40, -30, -30, -20],
    [-10, -20, -20, -20, -20, -20, -20, -10],
    [ 20,  20,   0,   0,   0,   0,  20,  20],
    [ 20,  30,  10,   0,   0,  10,  30,  20]
  ]
};

class ChessAI {
  constructor(engine) {
    this.engine = engine;
    this.nodesEvaluated = 0;
  }

  /**
   * Evaluate the board position from White's perspective (+ is good for White, - is good for Black)
   */
  evaluate(engine = this.engine) {
    let score = 0;

    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = engine.board[r][c];
        if (!piece) continue;

        const color = piece[0];
        const type = piece[1];
        const val = PIECE_VALUES[type] || 0;

        // Positional score
        const tableRow = color === 'w' ? r : 7 - r;
        const pstVal = PST[type] ? PST[type][tableRow][c] : 0;
        const totalPieceVal = val + pstVal;

        if (color === 'w') {
          score += totalPieceVal;
        } else {
          score -= totalPieceVal;
        }
      }
    }

    return score;
  }

  /**
   * MVV-LVA (Most Valuable Victim - Least Valuable Attacker) move ordering
   */
  orderMoves(moves) {
    return moves.sort((a, b) => {
      let scoreA = 0;
      let scoreB = 0;

      if (a.captured) {
        const victimVal = PIECE_VALUES[a.captured[1]] || 0;
        const attackerVal = PIECE_VALUES[a.piece[1]] || 0;
        scoreA = 10000 + victimVal * 10 - attackerVal;
      }
      if (a.promo) scoreA += 9000;

      if (b.captured) {
        const victimVal = PIECE_VALUES[b.captured[1]] || 0;
        const attackerVal = PIECE_VALUES[b.piece[1]] || 0;
        scoreB = 10000 + victimVal * 10 - attackerVal;
      }
      if (b.promo) scoreB += 9000;

      return scoreB - scoreA;
    });
  }

  /**
   * Quiescence search to avoid the horizon effect on captures
   */
  quiesce(engine, alpha, beta, depth = 3) {
    this.nodesEvaluated++;
    const isWhite = engine.turn === 'w';
    const standPat = isWhite ? this.evaluate(engine) : -this.evaluate(engine);

    if (depth === 0) return standPat;
    if (standPat >= beta) return beta;
    if (standPat > alpha) alpha = standPat;

    // Only look at legal capture moves
    const legalMoves = engine.getLegalMoves();
    const captures = this.orderMoves(legalMoves.filter(m => m.captured || m.promo));

    for (const move of captures) {
      engine.makeMove(move, false);
      const score = -this.quiesce(engine, -beta, -alpha, depth - 1);
      engine.undo();

      if (score >= beta) return beta;
      if (score > alpha) alpha = score;
    }

    return alpha;
  }

  /**
   * Minimax with Alpha-Beta Pruning
   */
  minimax(engine, depth, alpha, beta, isMaximizing) {
    this.nodesEvaluated++;

    const gameOver = engine.isGameOver();
    if (gameOver.gameOver) {
      if (gameOver.result === 'checkmate') {
        // Shorter checkmates are preferred
        return isMaximizing ? (-50000 - depth) : (50000 + depth);
      }
      return 0; // Draw
    }

    if (depth === 0) {
      return this.quiesce(engine, alpha, beta, 2);
    }

    const legalMoves = this.orderMoves(engine.getLegalMoves());

    if (isMaximizing) {
      let maxEval = -Infinity;
      for (const move of legalMoves) {
        engine.makeMove(move, false);
        const ev = this.minimax(engine, depth - 1, alpha, beta, false);
        engine.undo();

        maxEval = Math.max(maxEval, ev);
        alpha = Math.max(alpha, ev);
        if (beta <= alpha) break; // Pruning
      }
      return maxEval;
    } else {
      let minEval = Infinity;
      for (const move of legalMoves) {
        engine.makeMove(move, false);
        const ev = this.minimax(engine, depth - 1, alpha, beta, true);
        engine.undo();

        minEval = Math.min(minEval, ev);
        beta = Math.min(beta, ev);
        if (beta <= alpha) break; // Pruning
      }
      return minEval;
    }
  }

  /**
   * Pick the best move for the current position
   * @param {number} depth Search depth (1=Easy, 2=Medium, 3=Hard, 4=Expert)
   */
  getBestMove(depth = 3, engine = this.engine) {
    this.nodesEvaluated = 0;
    const legalMoves = engine.getLegalMoves();
    if (legalMoves.length === 0) return null;

    // Beginner randomness: sometimes pick a random legal move
    if (depth === 1 && Math.random() < 0.3) {
      return legalMoves[Math.floor(Math.random() * legalMoves.length)];
    }

    const isWhite = engine.turn === 'w';
    let bestMoves = [];
    let bestScore = isWhite ? -Infinity : Infinity;

    const orderedMoves = this.orderMoves(legalMoves);

    for (const move of orderedMoves) {
      engine.makeMove(move, false);
      const score = this.minimax(
        engine,
        depth - 1,
        -Infinity,
        Infinity,
        !isWhite
      );
      engine.undo();

      if (isWhite) {
        if (score > bestScore) {
          bestScore = score;
          bestMoves = [move];
        } else if (score === bestScore) {
          bestMoves.push(move);
        }
      } else {
        if (score < bestScore) {
          bestScore = score;
          bestMoves = [move];
        } else if (score === bestScore) {
          bestMoves.push(move);
        }
      }
    }

    // Pick randomly among tied best moves for variety
    const chosenMove = bestMoves[Math.floor(Math.random() * bestMoves.length)] || legalMoves[0];
    return {
      move: chosenMove,
      score: bestScore,
      nodes: this.nodesEvaluated
    };
  }

  /**
   * Convert centipawn score to winning probability percentage (0% to 100% for White)
   */
  static scoreToWinRate(score) {
    // Sigmoid curve mapping
    const cp = Math.max(-1500, Math.min(1500, score));
    const winRate = 50 + 50 * (2 / (1 + Math.exp(-0.0035 * cp)) - 1);
    return Math.round(winRate);
  }
}
