/**
 * Main Application Controller for Grandmaster Chess & AI Simulator
 */

document.addEventListener('DOMContentLoaded', () => {
  // Engines & Helpers
  const engine = new ChessEngine();
  const ai = new ChessAI(engine);

  // State
  let mode = 'pve-white'; // 'pve-white' | 'pve-black' | 'pvp' | 'sim'
  let flipped = false;
  let selectedSquare = null;
  let legalMovesForSelected = [];
  let lastMove = null;
  let pendingPromoMove = null;

  // Simulation State
  let simRunning = false;
  let simTimer = null;
  let simSpeed = 600;
  let totalSimMoves = 0;

  // Preset FENs
  const PRESETS = {
    'standard': 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    'scholars-mate': 'r1bqk1nr/pppp1ppp/2n5/2b1p3/2B1P3/5Q2/PPPP1PPP/RNB1K1NR w KQkq - 4 4',
    'opera-game': '4kb1r/p2rqppp/5n2/1B2p1B1/4P3/1Q6/PPP2PPP/2KR4 w k - 0 14',
    'endgame-kp': '8/8/4k3/8/8/4K3/4P3/8 w - - 0 1',
    'endgame-kr': '8/8/8/4k3/8/8/4K3/R7 w - - 0 1'
  };

  // DOM Elements
  const boardEl = document.getElementById('chessboard');
  const overlayEl = document.getElementById('game-overlay');
  const overlayTitleEl = document.getElementById('overlay-title');
  const overlaySubtitleEl = document.getElementById('overlay-subtitle');
  const modeBadgeEl = document.getElementById('mode-badge');
  const themeSelector = document.getElementById('theme-selector');
  const btnFlip = document.getElementById('btn-flip');
  const btnSound = document.getElementById('btn-sound');
  const soundLabel = document.getElementById('sound-label');
  const gameModeSelect = document.getElementById('game-mode-select');
  const aiDifficultySelect = document.getElementById('ai-difficulty');
  const btnUndo = document.getElementById('btn-undo');
  const btnReset = document.getElementById('btn-reset');
  const btnRestartOverlay = document.getElementById('btn-restart-overlay');

  // Simulation DOM
  const simIndicator = document.getElementById('sim-indicator');
  const simStateText = document.getElementById('sim-state-text');
  const simStatsEval = document.getElementById('sim-stats-eval');
  const simWhiteLevel = document.getElementById('sim-white-level');
  const simBlackLevel = document.getElementById('sim-black-level');
  const simSpeedInput = document.getElementById('sim-speed');
  const speedLabel = document.getElementById('speed-label');
  const btnSimPlay = document.getElementById('btn-sim-play');
  const btnSimStep = document.getElementById('btn-sim-step');
  const simMovesCount = document.getElementById('sim-moves-count');
  const simLastDepth = document.getElementById('sim-last-depth');
  const simNodesCount = document.getElementById('sim-nodes-count');

  // Eval bar DOM
  const evalBlack = document.getElementById('eval-black');
  const evalWhite = document.getElementById('eval-white');
  const evalLabel = document.getElementById('eval-label');

  // Player Bar DOM
  const whiteName = document.getElementById('white-name');
  const blackName = document.getElementById('black-name');
  const whiteTurnPill = document.getElementById('white-turn-pill');
  const blackTurnPill = document.getElementById('black-turn-pill');
  const whiteBar = document.getElementById('white-bar');
  const blackBar = document.getElementById('black-bar');
  const whiteCaptured = document.getElementById('white-captured').querySelector('.pieces-list');
  const blackCaptured = document.getElementById('black-captured').querySelector('.pieces-list');
  const whiteLead = document.getElementById('white-lead');
  const blackLead = document.getElementById('black-lead');

  // Tabs DOM
  const tabButtons = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');
  const moveHistoryBody = document.getElementById('move-history-body');
  const historyContainer = document.getElementById('history-container');

  // Scenarios DOM
  const presetSelect = document.getElementById('preset-scenarios');
  const btnLoadPreset = document.getElementById('btn-load-preset');
  const fenInput = document.getElementById('fen-input');
  const btnLoadFen = document.getElementById('btn-load-fen');
  const btnCopyFen = document.getElementById('btn-copy-fen');

  // Promotion DOM
  const promoModal = document.getElementById('promo-modal');
  const promoOptions = document.getElementById('promo-options');

  // Dynamic & Creative Feature DOM
  const boardContainer = document.getElementById('board-container');
  const dimensionSelect = document.getElementById('dimension-select');
  const btnHeatmap = document.getElementById('btn-heatmap');
  const btnToggleRecord = document.getElementById('btn-toggle-record');
  const recordBtnText = document.getElementById('record-btn-text');
  const recBadge = document.getElementById('rec-badge');
  const recTimeText = document.getElementById('rec-time-text');
  const variantSelect = document.getElementById('variant-select');
  const btnChess960 = document.getElementById('btn-chess960');
  const commentaryTextEl = document.getElementById('commentary-text');
  const graphLeadText = document.getElementById('graph-lead-text');

  // Dynamic Engines
  const fxCanvas = document.getElementById('fx-canvas');
  const fx = new ChessFX(fxCanvas);
  fx.setBoardElement(boardContainer);
  const heatmap = new ChessHeatmap(engine);
  const commentator = new ChessCommentator();
  const evalGraph = new EvalGraph(document.getElementById('eval-graph-canvas'));
  const fourD = new FourDDimensionEngine(document.getElementById('four-d-canvas'));
  const recorder = new ChessRecorder(engine, ai);

  let recTimer = null;
  let recSeconds = 0;

  // Initialize
  initApp();

  function initApp() {
    setupEventListeners();
    setupReviewTheater();
    renderBoard();
    updateUI();
  }

  function setDimension(dim) {
    if (dim === '2d') {
      boardContainer.classList.remove('is-3d');
      if (fourD.active) fourD.toggle();
      setTimeout(() => fx.resize(), 150);
    } else if (dim === '3d') {
      if (fourD.active) fourD.toggle();
      boardContainer.classList.add('is-3d');
      setTimeout(() => fx.resize(), 300);
    } else if (dim === '4d') {
      boardContainer.classList.remove('is-3d');
      if (!fourD.active) fourD.toggle();
      setTimeout(() => fx.resize(), 300);
      if (commentaryTextEl) commentaryTextEl.textContent = '🌀 4D Quantum Matrix activated! Tesseract perspective engaged.';
    }
  }

  function setupEventListeners() {
    // Dimension Selector (2D / 3D / 4D)
    if (dimensionSelect) {
      dimensionSelect.addEventListener('change', (e) => {
        setDimension(e.target.value);
      });
    }

    // User-controlled Recording Toggle (OFF by default)
    if (btnToggleRecord) {
      btnToggleRecord.addEventListener('click', () => {
        if (!recorder.isRecording) {
          // Enable recording on user command
          recorder.start();
          recBadge.style.display = 'inline-flex';
          btnToggleRecord.classList.add('btn-danger');
          btnToggleRecord.classList.remove('btn-secondary');
          recordBtnText.textContent = 'Stop Recording';
          recSeconds = 0;
          recTimeText.textContent = 'REC 00:00';
          clearInterval(recTimer);
          recTimer = setInterval(() => {
            recSeconds++;
            const m = String(Math.floor(recSeconds / 60)).padStart(2, '0');
            const s = String(recSeconds % 60).padStart(2, '0');
            recTimeText.textContent = `REC ${m}:${s}`;
          }, 1000);
          if (commentaryTextEl) commentaryTextEl.textContent = '⏺️ Match recording started! Every move and evaluation will be captured.';
        } else {
          // Disable recording
          recorder.stop();
          recBadge.style.display = 'none';
          btnToggleRecord.classList.remove('btn-danger');
          btnToggleRecord.classList.add('btn-secondary');
          recordBtnText.textContent = 'Record Match';
          clearInterval(recTimer);
          if (commentaryTextEl) commentaryTextEl.textContent = `⏹️ Recording stopped. Captured ${recorder.records.length} moves. Click "Review Game" to view AI coach analysis!`;
        }
      });
    }

    // Heatmap toggle
    if (btnHeatmap) {
      btnHeatmap.addEventListener('click', () => {
        const enabled = heatmap.toggle();
        btnHeatmap.classList.toggle('active-toggle', enabled);
        heatmap.renderToDOM(boardEl, flipped);
      });
    }

    // Game Variant Selector
    if (variantSelect) {
      variantSelect.addEventListener('change', (e) => {
        const v = e.target.value;
        engine.variant = v;
        document.body.classList.toggle('koth-active', v === 'koth');
        resetGame();
      });
    }

    // Fischer Random Chess960 Generator
    if (btnChess960) {
      btnChess960.addEventListener('click', () => {
        stopSimulation();
        const fen = ChessEngine.generateChess960FEN();
        engine.reset(fen, engine.variant);
        totalSimMoves = 0;
        moveHistoryBody.innerHTML = '';
        evalGraph.reset();
        overlayEl.classList.remove('visible');
        selectedSquare = null;
        legalMovesForSelected = [];
        lastMove = null;
        commentaryTextEl.textContent = '🎲 Fischer Random (Chess960) generated! An unpredictable tactical battle begins.';
        renderBoard();
        updateUI();
      });
    }

    // Theme selector
    themeSelector.addEventListener('change', (e) => {
      document.body.setAttribute('data-theme', e.target.value);
    });

    // Flip board
    btnFlip.addEventListener('click', () => {
      flipped = !flipped;
      renderBoard();
    });

    // Sound toggle
    btnSound.addEventListener('click', () => {
      const isEnabled = window.chessAudio.toggle();
      soundLabel.textContent = isEnabled ? 'Sound On' : 'Muted';
      btnSound.style.opacity = isEnabled ? '1' : '0.6';
    });

    // Game Mode selector
    gameModeSelect.addEventListener('change', (e) => {
      mode = e.target.value;
      if (mode === 'pve-black') {
        flipped = true;
      } else {
        flipped = false;
      }
      stopSimulation();
      resetGame();
    });

    // Tab buttons
    tabButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        tabButtons.forEach(b => b.classList.remove('active'));
        tabContents.forEach(c => c.classList.remove('active'));
        btn.classList.add('active');
        const tabId = btn.getAttribute('data-tab');
        document.getElementById(tabId).classList.add('active');

        if (tabId === 'tab-sim') {
          mode = 'sim';
          modeBadgeEl.textContent = 'AI Simulation';
          whiteName.textContent = `AI White (Lvl ${simWhiteLevel.value})`;
          blackName.textContent = `AI Black (Lvl ${simBlackLevel.value})`;
        } else if (tabId === 'tab-play') {
          stopSimulation();
          mode = gameModeSelect.value;
          updatePlayerNames();
        }
      });
    });

    // Undo move
    btnUndo.addEventListener('click', () => {
      if (simRunning) stopSimulation();
      if (mode === 'pve-white' || mode === 'pve-black') {
        // Undo AI move and player move
        engine.undo();
        engine.undo();
        if (evalGraph) {
          evalGraph.popEval();
          evalGraph.popEval();
        }
      } else {
        engine.undo();
        if (evalGraph) evalGraph.popEval();
      }
      selectedSquare = null;
      legalMovesForSelected = [];
      lastMove = engine.history.length > 0 ? engine.history[engine.history.length - 1].move : null;
      if (commentaryTextEl) commentaryTextEl.textContent = 'Move undone.';
      renderBoard();
      updateUI();
    });

    // Reset game
    btnReset.addEventListener('click', () => resetGame());
    btnRestartOverlay.addEventListener('click', () => {
      overlayEl.classList.remove('visible');
      resetGame();
    });

    // Simulation controls
    simSpeedInput.addEventListener('input', (e) => {
      simSpeed = parseInt(e.target.value, 10);
      speedLabel.textContent = `${simSpeed}ms`;
    });

    btnSimPlay.addEventListener('click', () => {
      if (simRunning) {
        stopSimulation();
      } else {
        startSimulation();
      }
    });

    btnSimStep.addEventListener('click', () => {
      if (simRunning) stopSimulation();
      stepSimulation();
    });

    simWhiteLevel.addEventListener('change', () => {
      if (mode === 'sim') whiteName.textContent = `AI White (Lvl ${simWhiteLevel.value})`;
    });

    simBlackLevel.addEventListener('change', () => {
      if (mode === 'sim') blackName.textContent = `AI Black (Lvl ${simBlackLevel.value})`;
    });

    // Scenarios & FEN
    btnLoadPreset.addEventListener('click', () => {
      const fen = PRESETS[presetSelect.value];
      if (fen) {
        stopSimulation();
        totalSimMoves = 0;
        moveHistoryBody.innerHTML = '';
        if (evalGraph) evalGraph.reset();
        if (commentaryTextEl) commentaryTextEl.textContent = `Scenario loaded: ${presetSelect.options[presetSelect.selectedIndex].text}`;
        overlayEl.classList.remove('visible');
        engine.reset(fen, engine.variant);
        selectedSquare = null;
        legalMovesForSelected = [];
        lastMove = null;
        renderBoard();
        updateUI();
      }
    });

    btnLoadFen.addEventListener('click', () => {
      const val = fenInput.value.trim();
      if (val) {
        try {
          stopSimulation();
          totalSimMoves = 0;
          moveHistoryBody.innerHTML = '';
          if (evalGraph) evalGraph.reset();
          if (commentaryTextEl) commentaryTextEl.textContent = 'Custom FEN position loaded.';
          overlayEl.classList.remove('visible');
          engine.reset(val, engine.variant);
          selectedSquare = null;
          legalMovesForSelected = [];
          lastMove = null;
          renderBoard();
          updateUI();
        } catch (err) {
          alert('Invalid FEN position string');
        }
      }
    });

    btnCopyFen.addEventListener('click', () => {
      navigator.clipboard.writeText(engine.toFEN());
      btnCopyFen.textContent = 'Copied!';
      setTimeout(() => { btnCopyFen.textContent = 'Copy FEN'; }, 1500);
    });
  }

  function setupReviewTheater() {
    const reviewModal = document.getElementById('review-modal');
    const btnOpenReview = document.getElementById('btn-open-review');
    const btnOverlayReview = document.getElementById('btn-overlay-review');
    const btnCloseReview = document.getElementById('btn-close-review');
    const scrubber = document.getElementById('replay-scrubber');
    const btnPrev = document.getElementById('btn-replay-prev');
    const btnNext = document.getElementById('btn-replay-next');
    const btnPlay = document.getElementById('btn-replay-play');
    const moveLabel = document.getElementById('replay-move-label');
    const coachNote = document.getElementById('replay-coach-note');

    let replayPlaying = false;
    let replayTimer = null;
    let liveStateBeforeReview = null;

    const openReview = () => {
      if (simRunning) stopSimulation();
      liveStateBeforeReview = engine.toFEN();

      const report = recorder.generateReviewReport();
      document.getElementById('review-white-acc').textContent = `${report.whiteAccuracy}%`;
      document.getElementById('review-white-desc').textContent = `${report.whiteCounts.brilliant + report.whiteCounts.best} precision moves`;

      document.getElementById('review-black-acc').textContent = `${report.blackAccuracy}%`;
      document.getElementById('review-black-desc').textContent = `${report.blackCounts.brilliant + report.blackCounts.best} precision moves`;

      document.getElementById('review-coach-summary').textContent = report.summaryText;

      document.getElementById('count-brilliant').textContent = report.whiteCounts.brilliant + report.blackCounts.brilliant;
      document.getElementById('count-best').textContent = report.whiteCounts.best + report.blackCounts.best;
      document.getElementById('count-excellent').textContent = report.whiteCounts.excellent + report.blackCounts.excellent;
      document.getElementById('count-inaccuracy').textContent = report.whiteCounts.inaccuracy + report.blackCounts.inaccuracy;
      document.getElementById('count-mistake').textContent = report.whiteCounts.mistake + report.blackCounts.mistake;
      document.getElementById('count-blunder').textContent = report.whiteCounts.blunder + report.blackCounts.blunder;

      scrubber.min = 0;
      scrubber.max = recorder.records.length;
      scrubber.value = recorder.records.length;

      updateReplayStep(recorder.records.length);
      reviewModal.classList.add('visible');
    };

    const closeReview = () => {
      reviewModal.classList.remove('visible');
      if (replayPlaying) {
        clearInterval(replayTimer);
        replayPlaying = false;
        btnPlay.textContent = '▶️ Play';
      }
      if (liveStateBeforeReview) {
        engine.loadFEN(liveStateBeforeReview);
        renderBoard();
        updateUI();
      }
    };

    const updateReplayStep = (index) => {
      index = parseInt(index, 10);
      scrubber.value = index;
      moveLabel.textContent = `Move ${index}/${recorder.records.length}`;

      if (index === 0) {
        engine.reset('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
        lastMove = null;
        renderBoard();
        coachNote.textContent = "Starting position. Match begins!";
        return;
      }

      const rec = recorder.records[index - 1];
      if (rec) {
        engine.loadFEN(rec.fenAfter);
        lastMove = rec.move;
        renderBoard();

        // Show classification badge on target square
        showClassificationBadge(rec.move.to.r, rec.move.to.c, rec.classification);

        coachNote.innerHTML = `<strong>${rec.isWhite ? 'White' : 'Black'} played ${rec.san}</strong> — <span style="color: ${rec.classification.color}; font-weight: bold;">${rec.classification.symbol} ${rec.classification.label}</span>. ${rec.commentary}`;
      }
    };

    if (btnOpenReview) btnOpenReview.addEventListener('click', openReview);
    if (btnOverlayReview) btnOverlayReview.addEventListener('click', openReview);
    if (btnCloseReview) btnCloseReview.addEventListener('click', closeReview);

    scrubber.addEventListener('input', (e) => {
      updateReplayStep(e.target.value);
    });

    btnPrev.addEventListener('click', () => {
      let current = parseInt(scrubber.value, 10);
      if (current > 0) {
        updateReplayStep(current - 1);
      }
    });

    btnNext.addEventListener('click', () => {
      let current = parseInt(scrubber.value, 10);
      if (current < recorder.records.length) {
        updateReplayStep(current + 1);
      }
    });

    btnPlay.addEventListener('click', () => {
      if (replayPlaying) {
        clearInterval(replayTimer);
        replayPlaying = false;
        btnPlay.textContent = '▶️ Play';
      } else {
        replayPlaying = true;
        btnPlay.textContent = '⏸️ Pause';

        if (parseInt(scrubber.value, 10) >= recorder.records.length) {
          updateReplayStep(0);
        }

        replayTimer = setInterval(() => {
          let current = parseInt(scrubber.value, 10);
          if (current < recorder.records.length) {
            updateReplayStep(current + 1);
          } else {
            clearInterval(replayTimer);
            replayPlaying = false;
            btnPlay.textContent = '▶️ Play';
          }
        }, 900);
      }
    });
  }

  function updatePlayerNames() {
    if (mode === 'pve-white') {
      modeBadgeEl.textContent = 'Human vs AI';
      whiteName.textContent = 'Human (You)';
      blackName.textContent = `Computer (Lvl ${aiDifficultySelect.value})`;
    } else if (mode === 'pve-black') {
      modeBadgeEl.textContent = 'Human vs AI';
      whiteName.textContent = `Computer (Lvl ${aiDifficultySelect.value})`;
      blackName.textContent = 'Human (You)';
    } else if (mode === 'pvp') {
      modeBadgeEl.textContent = 'Pass & Play';
      whiteName.textContent = 'White Player';
      blackName.textContent = 'Black Player';
    } else if (mode === 'sim') {
      modeBadgeEl.textContent = 'AI Simulation';
      whiteName.textContent = `AI White (Lvl ${simWhiteLevel.value})`;
      blackName.textContent = `AI Black (Lvl ${simBlackLevel.value})`;
    }
  }

  function resetGame() {
    stopSimulation();
    totalSimMoves = 0;
    engine.reset(undefined, engine.variant);
    if (recorder && recorder.isRecording) {
      recorder.start();
      recSeconds = 0;
      if (recTimeText) recTimeText.textContent = 'REC 00:00';
    }
    selectedSquare = null;
    legalMovesForSelected = [];
    lastMove = null;
    moveHistoryBody.innerHTML = '';
    if (evalGraph) evalGraph.reset();
    if (commentaryTextEl) commentaryTextEl.textContent = "New game initialized. Waiting for White's move...";
    if (graphLeadText) graphLeadText.textContent = 'Equilibrium (0.0)';
    overlayEl.classList.remove('visible');
    updatePlayerNames();
    renderBoard();
    updateUI();

    // If human chose to play black against AI, AI starts
    if (mode === 'pve-black' && engine.turn === 'w') {
      setTimeout(makeAIMove, 400);
    }
  }

  function renderBoard() {
    boardEl.innerHTML = '';

    const inCheck = engine.isInCheck(engine.turn);
    const checkedKing = inCheck ? engine.findKing(engine.turn) : null;

    for (let rIdx = 0; rIdx < 8; rIdx++) {
      for (let cIdx = 0; cIdx < 8; cIdx++) {
        const r = flipped ? 7 - rIdx : rIdx;
        const c = flipped ? 7 - cIdx : cIdx;

        const sq = document.createElement('div');
        const isLight = (r + c) % 2 === 0;
        sq.className = `square ${isLight ? 'light' : 'dark'}`;
        sq.dataset.r = r;
        sq.dataset.c = c;

        // Last move highlight
        if (lastMove && (
          (lastMove.from.r === r && lastMove.from.c === c) ||
          (lastMove.to.r === r && lastMove.to.c === c)
        )) {
          sq.classList.add('last-move');
        }

        // Selected piece highlight
        if (selectedSquare && selectedSquare.r === r && selectedSquare.c === c) {
          sq.classList.add('selected');
        }

        // King in check highlight
        if (checkedKing && checkedKing.r === r && checkedKing.c === c) {
          sq.classList.add('in-check');
        }

        // Legal move indicators
        const legalDest = legalMovesForSelected.find(m => m.to.r === r && m.to.c === c);
        if (legalDest) {
          if (legalDest.captured || legalDest.isEnPassant) {
            sq.classList.add('legal-capture');
          } else {
            sq.classList.add('legal-target');
          }
        }

        // Coordinate labels on board edge
        if (cIdx === 0) {
          const rankLabel = document.createElement('span');
          rankLabel.className = 'coord-rank';
          rankLabel.textContent = 8 - r;
          sq.appendChild(rankLabel);
        }
        if (rIdx === 7) {
          const fileLabel = document.createElement('span');
          fileLabel.className = 'coord-file';
          fileLabel.textContent = String.fromCharCode(97 + c);
          sq.appendChild(fileLabel);
        }

        // Piece Icon
        const piece = engine.board[r][c];
        if (piece && PIECE_SVGS[piece]) {
          sq.innerHTML += PIECE_SVGS[piece];
        }

        // Click handler
        sq.addEventListener('click', () => handleSquareClick(r, c));

        boardEl.appendChild(sq);
      }
    }

    // Heatmap layer update
    if (heatmap) {
      heatmap.renderToDOM(boardEl, flipped);
    }
  }

  function handleSquareClick(r, c) {
    if (simRunning) return; // Locked during auto-simulation

    // In PvE mode, prevent user from moving during AI's turn
    if (mode === 'pve-white' && engine.turn === 'b') return;
    if (mode === 'pve-black' && engine.turn === 'w') return;

    const clickedPiece = engine.board[r][c];
    const isOurPiece = clickedPiece && clickedPiece[0] === engine.turn;

    // 1. If clicking an already selected square, deselect
    if (selectedSquare && selectedSquare.r === r && selectedSquare.c === c) {
      selectedSquare = null;
      legalMovesForSelected = [];
      renderBoard();
      return;
    }

    // 2. If a square is selected, check if clicked square is a legal target
    if (selectedSquare) {
      const move = legalMovesForSelected.find(m => m.to.r === r && m.to.c === c);
      if (move) {
        // Check for pawn promotion modal
        if (move.promo) {
          showPromotionModal(move);
          return;
        }

        executeMove(move);
        selectedSquare = null;
        legalMovesForSelected = [];
        return;
      }
    }

    // 3. Select friendly piece
    if (isOurPiece) {
      selectedSquare = { r, c };
      const allLegalMoves = engine.getLegalMoves();
      legalMovesForSelected = allLegalMoves.filter(m => m.from.r === r && m.from.c === c);
      renderBoard();
    } else {
      selectedSquare = null;
      legalMovesForSelected = [];
      renderBoard();
    }
  }

  function showPromotionModal(baseMove) {
    pendingPromoMove = baseMove;
    promoOptions.innerHTML = '';
    const color = engine.turn;
    const choices = ['Q', 'R', 'B', 'N'];

    choices.forEach(type => {
      const btn = document.createElement('button');
      btn.className = 'promo-btn';
      btn.innerHTML = PIECE_SVGS[color + type];
      btn.addEventListener('click', () => {
        promoModal.classList.remove('visible');
        const finalMove = { ...pendingPromoMove, promo: type };
        executeMove(finalMove);
        pendingPromoMove = null;
        selectedSquare = null;
        legalMovesForSelected = [];
      });
      promoOptions.appendChild(btn);
    });

    promoModal.classList.add('visible');
  }

  function showClassificationBadge(r, c, classification) {
    const sq = boardEl.querySelector(`.square[data-r="${r}"][data-c="${c}"]`);
    if (!sq) return;
    const old = sq.querySelector('.classification-badge');
    if (old) old.remove();

    const badge = document.createElement('div');
    badge.className = 'classification-badge';
    badge.style.backgroundColor = classification.color;
    badge.innerHTML = `${classification.symbol} ${classification.label}`;
    sq.appendChild(badge);
    setTimeout(() => {
      badge.style.opacity = '0';
      badge.style.transition = 'opacity 0.4s';
      setTimeout(() => badge.remove(), 400);
    }, 2400);
  }

  function executeMove(move) {
    const isCapture = !!move.captured || !!move.isEnPassant;
    const isCastle = !!move.isCastleK || !!move.isCastleQ;
    const san = engine.moveToSAN(move);
    const fenBefore = engine.toFEN();
    const evalBefore = ai.evaluate();

    const fromSq = boardEl.querySelector(`.square[data-r="${move.from.r}"][data-c="${move.from.c}"]`);
    const toSq = boardEl.querySelector(`.square[data-r="${move.to.r}"][data-c="${move.to.c}"]`);

    const finishMoveExecution = () => {
      // Make the move in engine
      engine.makeMove(move, false);
      if (engine.history.length > 0) {
        engine.history[engine.history.length - 1].san = san;
      }
      lastMove = move;

      // Audio feedback
      if (engine.isInCheck(engine.turn)) {
        window.chessAudio.playCheck();
      } else if (isCastle) {
        window.chessAudio.playCastle();
      } else if (isCapture) {
        window.chessAudio.playCapture();
      } else {
        window.chessAudio.playMove();
      }

      // FX particles
      if (toSq && fx) {
        const rect = toSq.getBoundingClientRect();
        const boardRect = boardContainer.getBoundingClientRect();
        const x = rect.left - boardRect.left + rect.width / 2;
        const y = rect.top - boardRect.top + rect.height / 2;
        if (isCapture) {
          fx.spawnCaptureBurst(x, y, move.piece[0]);
        } else {
          fx.spawnMoveRipple(x, y, move.piece[0]);
        }
      }

      // Record move into Match Review Recorder
      const evalAfter = ai.evaluate();
      const status = engine.isGameOver();
      const comment = commentator ? commentator.generateComment(
        engine, move, san, evalAfter, engine.isInCheck(engine.turn), status.gameOver, status
      ) : "";

      if (recorder) {
        recorder.recordMove(move, san, fenBefore, engine.toFEN(), evalBefore, evalAfter, comment);
      }

      // Render board and UI
      renderBoard();
      updateUI(san, move);

      // Show classification badge on the target square if brilliant, best, or blunder
      if (recorder && recorder.records.length > 0) {
        const lastRec = recorder.records[recorder.records.length - 1];
        if (['brilliant', 'best', 'blunder'].includes(lastRec.classification.type)) {
          showClassificationBadge(move.to.r, move.to.c, lastRec.classification);
        }
      }

      // Check game over
      if (status.gameOver) {
        handleGameOver(status);
        return;
      }

      // Trigger AI in PvE mode
      if ((mode === 'pve-white' && engine.turn === 'b') || (mode === 'pve-black' && engine.turn === 'w')) {
        setTimeout(makeAIMove, 280);
      }
    };

    // Smooth piece sliding animation
    if (fromSq && toSq && !simRunning) {
      const fromRect = fromSq.getBoundingClientRect();
      const toRect = toSq.getBoundingClientRect();
      const boardRect = boardContainer.getBoundingClientRect();

      const dx = toRect.left - fromRect.left;
      const dy = toRect.top - fromRect.top;

      const pieceEl = fromSq.querySelector('svg');
      if (pieceEl) {
        const floating = document.createElement('div');
        floating.className = 'animating-piece';
        floating.style.left = `${fromRect.left - boardRect.left}px`;
        floating.style.top = `${fromRect.top - boardRect.top}px`;
        floating.innerHTML = pieceEl.outerHTML;
        boardContainer.appendChild(floating);

        pieceEl.style.opacity = '0';

        requestAnimationFrame(() => {
          floating.style.transform = `translate(${dx}px, ${dy}px) scale(1.1)`;
        });

        setTimeout(() => {
          floating.remove();
          finishMoveExecution();
        }, 220);
        return;
      }
    }

    finishMoveExecution();
  }

  function makeAIMove() {
    if (engine.isGameOver().gameOver) return;

    const depth = parseInt(aiDifficultySelect.value, 10);
    const start = performance.now();
    const result = ai.getBestMove(depth);
    const elapsed = Math.round(performance.now() - start);

    if (result && result.move) {
      executeMove(result.move);
      simLastDepth.textContent = depth;
      simNodesCount.textContent = result.nodes.toLocaleString();
    }
  }

  function updateUI(latestSAN = null, latestMove = null) {
    // 1. Turn indicator
    if (engine.turn === 'w') {
      whiteBar.classList.add('active-turn');
      blackBar.classList.remove('active-turn');
    } else {
      whiteBar.classList.remove('active-turn');
      blackBar.classList.add('active-turn');
    }

    // 2. Evaluation bar & score
    const score = ai.evaluate();
    const winRate = ChessAI.scoreToWinRate(score);
    evalWhite.style.height = `${winRate}%`;
    evalBlack.style.height = `${100 - winRate}%`;

    const scoreStr = (score > 0 ? '+' : '') + (score / 100).toFixed(1);
    evalLabel.textContent = scoreStr;
    simStatsEval.textContent = scoreStr;

    // 3. FEN display
    fenInput.value = engine.toFEN();

    // 4. Update Captured Pieces
    renderCapturedPieces();

    // 5. Update Move History
    rebuildMoveHistory();

    // 6. Update Advantage Timeline Graph
    if (evalGraph && latestSAN) {
      evalGraph.pushEval(score);
    }
    if (graphLeadText) {
      if (score > 120) {
        graphLeadText.textContent = `White +${(score / 100).toFixed(1)}`;
      } else if (score < -120) {
        graphLeadText.textContent = `Black +${(Math.abs(score) / 100).toFixed(1)}`;
      } else {
        graphLeadText.textContent = 'Equilibrium (0.0)';
      }
    }

    // 7. Update Live Commentary
    if (latestMove && latestSAN && commentator) {
      const status = engine.isGameOver();
      const comment = commentator.generateComment(
        engine,
        latestMove,
        latestSAN,
        score,
        engine.isInCheck(engine.turn),
        status.gameOver,
        status
      );
      if (commentaryTextEl) {
        commentaryTextEl.style.opacity = '0';
        setTimeout(() => {
          commentaryTextEl.textContent = comment;
          commentaryTextEl.style.opacity = '1';
        }, 150);
      }
    }

    // 8. Heatmap layer
    if (heatmap) {
      heatmap.renderToDOM(boardEl, flipped);
    }
  }

  function renderCapturedPieces() {
    // Initial standard set
    const initial = { P: 8, N: 2, B: 2, R: 2, Q: 1 };
    const currentW = { P: 0, N: 0, B: 0, R: 0, Q: 0 };
    const currentB = { P: 0, N: 0, B: 0, R: 0, Q: 0 };

    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = engine.board[r][c];
        if (piece) {
          const color = piece[0];
          const type = piece[1];
          if (type !== 'K') {
            if (color === 'w') currentW[type]++;
            else currentB[type]++;
          }
        }
      }
    }

    // Pieces captured by White (missing Black pieces)
    whiteCaptured.innerHTML = '';
    let whiteMatAdv = 0;
    for (const [type, count] of Object.entries(initial)) {
      const lost = count - currentB[type];
      for (let i = 0; i < lost; i++) {
        const span = document.createElement('span');
        span.className = 'captured-piece-svg';
        span.innerHTML = PIECE_SVGS['b' + type];
        whiteCaptured.appendChild(span);
      }
    }

    // Pieces captured by Black (missing White pieces)
    blackCaptured.innerHTML = '';
    for (const [type, count] of Object.entries(initial)) {
      const lost = count - currentW[type];
      for (let i = 0; i < lost; i++) {
        const span = document.createElement('span');
        span.className = 'captured-piece-svg';
        span.innerHTML = PIECE_SVGS['w' + type];
        blackCaptured.appendChild(span);
      }
    }

    // Material lead calculation
    let wVal = 0, bVal = 0;
    for (const [type, count] of Object.entries(currentW)) wVal += count * PIECE_VALUES[type];
    for (const [type, count] of Object.entries(currentB)) bVal += count * PIECE_VALUES[type];

    const diff = Math.round((wVal - bVal) / 100);
    if (diff > 0) {
      whiteLead.textContent = `+${diff}`;
      blackLead.textContent = '';
    } else if (diff < 0) {
      whiteLead.textContent = '';
      blackLead.textContent = `+${Math.abs(diff)}`;
    } else {
      whiteLead.textContent = '';
      blackLead.textContent = '';
    }
  }

  function rebuildMoveHistory() {
    moveHistoryBody.innerHTML = '';
    for (let i = 0; i < engine.history.length; i++) {
      const h = engine.history[i];
      if (!h.san) continue;
      const isWhite = h.turn === 'w';
      const moveNum = h.moveNumber;

      if (isWhite) {
        const tr = document.createElement('tr');
        tr.id = `move-row-${moveNum}`;
        tr.innerHTML = `
          <td style="color: var(--text-secondary);">${moveNum}.</td>
          <td class="move-cell">${h.san}</td>
          <td class="move-cell"></td>
        `;
        moveHistoryBody.appendChild(tr);
      } else {
        let tr = document.getElementById(`move-row-${moveNum}`);
        if (!tr) {
          tr = document.createElement('tr');
          tr.id = `move-row-${moveNum}`;
          tr.innerHTML = `
            <td style="color: var(--text-secondary);">${moveNum}.</td>
            <td class="move-cell">...</td>
            <td class="move-cell">${h.san}</td>
          `;
          moveHistoryBody.appendChild(tr);
        } else {
          const cells = tr.querySelectorAll('.move-cell');
          if (cells[1]) cells[1].textContent = h.san;
        }
      }
    }

    // Highlight active latest move
    const cells = moveHistoryBody.querySelectorAll('.move-cell');
    for (let i = cells.length - 1; i >= 0; i--) {
      if (cells[i].textContent.trim() && cells[i].textContent !== '...') {
        cells[i].classList.add('active-move');
        break;
      }
    }

    historyContainer.scrollTop = historyContainer.scrollHeight;
  }

  function handleGameOver(status) {
    stopSimulation();
    if (status.result === 'checkmate') {
      window.chessAudio.playGameOver(status.winner === 'w');
      overlayTitleEl.textContent = 'Checkmate!';
      overlaySubtitleEl.textContent = `${status.winner === 'w' ? 'White' : 'Black'} wins by checkmate.`;
    } else {
      window.chessAudio.playGameOver(false);
      overlayTitleEl.textContent = 'Game Drawn!';
      overlaySubtitleEl.textContent = `Game ended in ${status.result}.`;
    }
    overlayEl.classList.add('visible');
  }

  /* ==========================================================================
     AI vs AI Simulation System
     ========================================================================== */

  function startSimulation() {
    const status = engine.isGameOver();
    if (status.gameOver) {
      resetGame();
    }
    simRunning = true;
    btnSimPlay.textContent = 'Pause Simulation';
    btnSimPlay.classList.replace('btn-primary', 'btn-secondary');
    simIndicator.classList.add('running');
    simStateText.textContent = 'Simulating...';

    runSimLoop();
  }

  function stopSimulation() {
    simRunning = false;
    clearTimeout(simTimer);
    btnSimPlay.textContent = 'Start Simulation';
    btnSimPlay.classList.replace('btn-secondary', 'btn-primary');
    simIndicator.classList.remove('running');
    simStateText.textContent = 'Paused';
  }

  function stepSimulation() {
    const status = engine.isGameOver();
    if (status.gameOver) {
      stopSimulation();
      return;
    }

    const currentTurn = engine.turn;
    const depth = parseInt(currentTurn === 'w' ? simWhiteLevel.value : simBlackLevel.value, 10);

    const start = performance.now();
    const result = ai.getBestMove(depth);
    const elapsed = Math.round(performance.now() - start);

    if (result && result.move) {
      totalSimMoves++;
      simMovesCount.textContent = totalSimMoves;
      simLastDepth.textContent = `${depth} (${elapsed}ms)`;
      simNodesCount.textContent = result.nodes.toLocaleString();

      executeMove(result.move);
    }
  }

  function runSimLoop() {
    if (!simRunning) return;

    const status = engine.isGameOver();
    if (status.gameOver) {
      stopSimulation();
      return;
    }

    stepSimulation();

    simTimer = setTimeout(() => {
      runSimLoop();
    }, simSpeed);
  }
});
