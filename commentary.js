/**
 * Live AI Chess Commentator & Tactical Narrator
 * Generates dynamic, context-aware commentary on moves, openings, and drama
 */

class ChessCommentator {
  constructor() {
    this.historyComments = [];
  }

  generateComment(engine, move, san, evalScore, isCheck, isGameOver, gameOverStatus) {
    const isWhite = move.piece[0] === 'w';
    const player = isWhite ? 'White' : 'Black';
    const opponent = isWhite ? 'Black' : 'White';
    const pieceType = move.piece[1];
    const moveNum = engine.moveNumber;

    // 1. Game Over
    if (isGameOver) {
      if (gameOverStatus.result === 'checkmate') {
        const winner = gameOverStatus.winner === 'w' ? 'White' : 'Black';
        return `🏆 Checkmate! ${winner} delivers the fatal blow with ${san}. Masterful finish!`;
      }
      return `🤝 Game concludes in a hard-fought draw (${gameOverStatus.result}).`;
    }

    // 2. Checks
    if (isCheck) {
      const checkPhrases = [
        `⚡ Check! ${player} puts ${opponent}'s King on notice with ${san}.`,
        `🎯 Aggressive check from ${player}! ${opponent} must respond immediately.`,
        `⚔️ ${san} sends tremors through ${opponent}'s defensive barricade!`
      ];
      return checkPhrases[Math.floor(Math.random() * checkPhrases.length)];
    }

    // 3. Opening book recognition (Moves 1-3)
    if (moveNum <= 3) {
      if (san === 'e4') return "White commands the center with the classic King's Pawn (1. e4).";
      if (san === 'e5') return "Black matches in the center — Open Game setup.";
      if (san === 'c5') return "The Sicilian Defense! A sharp, asymmetric battlefield begins.";
      if (san === 'd4') return "White takes central territory with Queen's Pawn (1. d4).";
      if (san === 'd5') return "Black firmly anchors the center.";
      if (san === 'Nf6') return "Hypermodern defense — contesting center squares from afar.";
      if (san === 'c6') return "The resilient Caro-Kann Defense is on the board.";
      if (san === 'e6') return "The French Defense — solid pawn chain incoming.";
      if (san === 'Nf3') return "Flexible knight deployment, keeping options wide open.";
      if (san === 'Bc4' || san === 'Bb5') return `White develops the bishop proactively with ${san}.`;
    }

    // 4. Castling
    if (move.isCastleK) {
      return `🏰 ${player} tucks their King into kingside safety and activates the rook.`;
    }
    if (move.isCastleQ) {
      return `🛡️ Queenside castling from ${player}! Opposite-side castling hints at fireworks!`;
    }

    // 5. Pawn Promotion
    if (move.promo) {
      return `👑 A heroic pawn reaches the back rank! Promoted to a new ${move.promo === 'Q' ? 'Queen' : move.promo}!`;
    }

    // 6. Major Captures
    if (move.captured) {
      const capType = move.captured[1];
      if (capType === 'Q') {
        return `💥 The Queen falls! ${player} snatches ${opponent}'s queen with ${san}!`;
      }
      if (capType === 'R') {
        return `⚡ Heavy artillery lost! Rook captured with ${san}.`;
      }
      if (capType === 'B' || capType === 'N') {
        return `⚔️ Tactical skirmish! Minor piece captured on ${ChessEngine.coordToSquare(move.to.r, move.to.c)}.`;
      }
      return `${player} captures a pawn with ${san}, chipping away at the defense.`;
    }

    // 7. Positional & Eval commentary
    if (Math.abs(evalScore) > 600) {
      const leader = evalScore > 0 ? 'White' : 'Black';
      return `📈 ${leader} holds an overwhelming material and positional stranglehold.`;
    } else if (Math.abs(evalScore) > 250) {
      const leader = evalScore > 0 ? 'White' : 'Black';
      return `✨ ${leader} steadily tightens the tactical screws with ${san}.`;
    }

    // 8. General piece moves
    if (pieceType === 'N') {
      return `${player}'s knight maneuvers skillfully to ${ChessEngine.coordToSquare(move.to.r, move.to.c)}.`;
    }
    if (pieceType === 'B') {
      return `${player} slices along the diagonal with bishop ${san}.`;
    }
    if (pieceType === 'R') {
      return `Rook slides into action with ${san}, eyeing the open files.`;
    }
    if (pieceType === 'Q') {
      return `${player}'s Queen glides into commanding central presence.`;
    }

    return `${player} pushes forward with ${san}.`;
  }
}
