/**
 * Chess Match Recorder & Post-Game Review Theater
 * Full game analysis, accuracy calculation, move classifications (Brilliant, Best, Blunder),
 * coach explanations, interactive replay scrubber, and WebM video export!
 */

class ChessRecorder {
  constructor(engine, ai) {
    this.engine = engine;
    this.ai = ai;
    this.records = []; // array of move records
    this.isRecording = false; // OFF BY DEFAULT: Only enabled on user command!
    this.startTime = null;

    // MediaRecorder for video export
    this.mediaRecorder = null;
    this.recordedVideoBlobs = [];
    this.isVideoRecording = false;

    // Review playback state
    this.reviewIndex = 0;
    this.reviewPlaying = false;
    this.reviewSpeed = 1000;
    this.reviewTimer = null;
  }

  start() {
    this.records = [];
    this.startTime = Date.now();
    this.isRecording = true;
  }

  stop() {
    this.isRecording = false;
  }

  recordMove(move, san, fenBefore, fenAfter, evalBefore, evalAfter, commentary) {
    if (!this.isRecording) return;

    const ply = this.records.length;
    const isWhite = move.piece[0] === 'w';
    const evalDelta = isWhite ? (evalAfter - evalBefore) : (evalBefore - evalAfter);

    // Classify move
    const classification = this.classifyMove(move, evalDelta, evalBefore, evalAfter, isWhite);

    this.records.push({
      ply,
      moveNumber: Math.floor(ply / 2) + 1,
      isWhite,
      move,
      san,
      fenBefore,
      fenAfter,
      evalBefore,
      evalAfter,
      evalDelta,
      classification,
      commentary,
      timestamp: (Date.now() - this.startTime) / 1000
    });
  }

  classifyMove(move, delta, evalBefore, evalAfter, isWhite) {
    // Brilliant: Sacrifice or tactical masterpiece
    if (move.captured && Math.abs(evalAfter) > 200 && delta >= 50) {
      if (['Q', 'R', 'B'].includes(move.piece[1]) && move.captured[1] === 'P') {
        return { type: 'brilliant', label: 'Brilliant', symbol: '💎', color: '#06b6d4' };
      }
    }

    if (delta >= -15) {
      return { type: 'best', label: 'Best Move', symbol: '⭐', color: '#10b981' };
    } else if (delta >= -45) {
      return { type: 'excellent', label: 'Excellent', symbol: '✓', color: '#38bdf8' };
    } else if (delta >= -110) {
      return { type: 'inaccuracy', label: 'Inaccuracy', symbol: '?!', color: '#facc15' };
    } else if (delta >= -240) {
      return { type: 'mistake', label: 'Mistake', symbol: '?', color: '#fb923c' };
    } else {
      return { type: 'blunder', label: 'Blunder', symbol: '??', color: '#ef4444' };
    }
  }

  /**
   * Calculate accuracy percentage and statistical breakdown for White and Black
   */
  generateReviewReport() {
    if (this.records.length === 0) {
      return {
        whiteAccuracy: 0,
        blackAccuracy: 0,
        whiteCounts: { brilliant: 0, best: 0, excellent: 0, inaccuracy: 0, mistake: 0, blunder: 0 },
        blackCounts: { brilliant: 0, best: 0, excellent: 0, inaccuracy: 0, mistake: 0, blunder: 0 },
        summaryText: "Recording is currently turned off. To record a match and view AI accuracy reports, click 'Record Match' in the header before or during your game!",
        totalMoves: 0
      };
    }

    let whiteLossSum = 0, whiteMoves = 0;
    let blackLossSum = 0, blackMoves = 0;

    const whiteCounts = { brilliant: 0, best: 0, excellent: 0, inaccuracy: 0, mistake: 0, blunder: 0 };
    const blackCounts = { brilliant: 0, best: 0, excellent: 0, inaccuracy: 0, mistake: 0, blunder: 0 };

    for (const rec of this.records) {
      const cpl = Math.max(0, -rec.evalDelta);
      if (rec.isWhite) {
        whiteLossSum += cpl;
        whiteMoves++;
        whiteCounts[rec.classification.type]++;
      } else {
        blackLossSum += cpl;
        blackMoves++;
        blackCounts[rec.classification.type]++;
      }
    }

    const whiteAvgCpl = whiteMoves > 0 ? (whiteLossSum / whiteMoves) : 0;
    const blackAvgCpl = blackMoves > 0 ? (blackLossSum / blackMoves) : 0;

    // Standard Accuracy Curve: 100 / (1 + (loss / 50)^1.2)
    const whiteAccuracy = whiteMoves > 0 ? Math.max(25, Math.min(99.5, Math.round(100 / (1 + Math.pow(whiteAvgCpl / 55, 1.2)) * 10) / 10)) : 100;
    const blackAccuracy = blackMoves > 0 ? Math.max(25, Math.min(99.5, Math.round(100 / (1 + Math.pow(blackAvgCpl / 55, 1.2)) * 10) / 10)) : 100;

    // Coach summary narrative
    let summaryText = "";
    if (whiteAccuracy > blackAccuracy + 8) {
      summaryText = "White dominated this game with superior tactical vigilance, converting advantageous opportunities while Black struggled with key inaccuracies.";
    } else if (blackAccuracy > whiteAccuracy + 8) {
      summaryText = "Black exhibited exceptional tactical precision, punishing White's defensive mistakes to seize command of the board.";
    } else {
      summaryText = "A remarkably balanced duel! Both sides demonstrated tenacious resourcefulness in a razor-sharp battle.";
    }

    return {
      whiteAccuracy,
      blackAccuracy,
      whiteCounts,
      blackCounts,
      summaryText,
      totalMoves: this.records.length
    };
  }

  /* ==========================================================================
     WebM Video Recording of Game Canvas
     ========================================================================== */

  startVideoRecording(boardElement) {
    if (this.isVideoRecording) return;
    this.recordedVideoBlobs = [];

    // Capture board container onto temporary canvas stream
    try {
      const stream = boardElement.captureStream ? boardElement.captureStream(30) : null;
      if (stream) {
        this.mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
        this.mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) this.recordedVideoBlobs.push(e.data);
        };
        this.mediaRecorder.start();
        this.isVideoRecording = true;
      }
    } catch (err) {
      console.warn('Canvas stream capture not supported or blocked:', err);
    }
  }

  stopVideoRecording() {
    if (!this.isVideoRecording || !this.mediaRecorder) return null;
    return new Promise((resolve) => {
      this.mediaRecorder.onstop = () => {
        const blob = new Blob(this.recordedVideoBlobs, { type: 'video/webm' });
        this.isVideoRecording = false;
        resolve(blob);
      };
      this.mediaRecorder.stop();
    });
  }
}
