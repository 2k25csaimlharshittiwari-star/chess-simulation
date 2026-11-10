/**
 * Robust Chess Engine
 * Complete implementation of standard chess rules, move generation,
 * check/checkmate/stalemate detection, SAN notation, and FEN import/export.
 */

class ChessEngine {
  constructor(fen) {
    this.reset(fen);
  }

  reset(fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1', variant = 'standard') {
    this.board = Array(8).fill(null).map(() => Array(8).fill(null));
    this.turn = 'w';
    this.variant = variant; // 'standard' | 'koth'
    this.castling = { wK: true, wQ: true, bK: true, bQ: true };
    this.enPassant = null; // { r, c }
    this.halfMoves = 0;
    this.moveNumber = 1;
    this.history = []; // stack for undo

    this.loadFEN(fen);
  }

  static generateChess960FEN() {
    const pieces = Array(8).fill(null);
    // 1. Light-square bishop
    const lightCols = [1, 3, 5, 7];
    const b1 = lightCols[Math.floor(Math.random() * lightCols.length)];
    pieces[b1] = 'B';

    // 2. Dark-square bishop
    const darkCols = [0, 2, 4, 6];
    const b2 = darkCols[Math.floor(Math.random() * darkCols.length)];
    pieces[b2] = 'B';

    // 3. Queen
    let empty = [];
    for (let i = 0; i < 8; i++) if (!pieces[i]) empty.push(i);
    const qCol = empty[Math.floor(Math.random() * empty.length)];
    pieces[qCol] = 'Q';

    // 4. Knights
    empty = [];
    for (let i = 0; i < 8; i++) if (!pieces[i]) empty.push(i);
    const n1 = empty.splice(Math.floor(Math.random() * empty.length), 1)[0];
    const n2 = empty.splice(Math.floor(Math.random() * empty.length), 1)[0];
    pieces[n1] = 'N';
    pieces[n2] = 'N';

    // 5. King between Rooks
    empty.sort((a, b) => a - b);
    pieces[empty[0]] = 'R';
    pieces[empty[1]] = 'K';
    pieces[empty[2]] = 'R';

    const rank1 = pieces.join('');
    const rank8 = rank1.toLowerCase();
    return `${rank8}/pppppppp/8/8/8/8/PPPPPPPP/${rank1} w - - 0 1`;
  }

  static squareToCoord(sq) {
    if (!sq || sq.length < 2) return null;
    const c = sq.charCodeAt(0) - 97;
    const r = 8 - parseInt(sq[1], 10);
    if (r < 0 || r > 7 || c < 0 || c > 7) return null;
    return { r, c };
  }

  static coordToSquare(r, c) {
    return String.fromCharCode(97 + c) + (8 - r);
  }

  colorOf(piece) {
    return piece ? piece[0] : null;
  }

  typeOf(piece) {
    return piece ? piece[1] : null;
  }

  getPiece(r, c) {
    if (r < 0 || r > 7 || c < 0 || c > 7) return null;
    return this.board[r][c];
  }

  setPiece(r, c, piece) {
    this.board[r][c] = piece;
  }

  cloneState() {
    return {
      board: this.board.map(row => [...row]),
      turn: this.turn,
      castling: { ...this.castling },
      enPassant: this.enPassant ? { ...this.enPassant } : null,
      halfMoves: this.halfMoves,
      moveNumber: this.moveNumber
    };
  }

  loadFEN(fen) {
    const parts = fen.trim().split(/\s+/);
    const rows = parts[0].split('/');

    this.board = Array(8).fill(null).map(() => Array(8).fill(null));
    for (let r = 0; r < 8; r++) {
      let c = 0;
      for (const ch of rows[r]) {
        if (/\d/.test(ch)) {
          c += parseInt(ch, 10);
        } else {
          const color = ch === ch.toUpperCase() ? 'w' : 'b';
          const type = ch.toUpperCase();
          this.board[r][c] = color + type;
          c++;
        }
      }
    }

    this.turn = (parts[1] && parts[1].toLowerCase() === 'b') ? 'b' : 'w';

    this.castling = { wK: false, wQ: false, bK: false, bQ: false };
    if (parts[2]) {
      if (parts[2].includes('K')) this.castling.wK = true;
      if (parts[2].includes('Q')) this.castling.wQ = true;
      if (parts[2].includes('k')) this.castling.bK = true;
      if (parts[2].includes('q')) this.castling.bQ = true;
    }

    this.enPassant = (parts[3] && parts[3] !== '-') ? ChessEngine.squareToCoord(parts[3]) : null;
    this.halfMoves = parts[4] ? parseInt(parts[4], 10) : 0;
    this.moveNumber = parts[5] ? parseInt(parts[5], 10) : 1;
    this.history = [];
  }

  toFEN() {
    const rows = [];
    for (let r = 0; r < 8; r++) {
      let empty = 0;
      let rowStr = '';
      for (let c = 0; c < 8; c++) {
        const piece = this.board[r][c];
        if (!piece) {
          empty++;
        } else {
          if (empty > 0) {
            rowStr += empty;
            empty = 0;
          }
          const ch = piece[0] === 'w' ? piece[1].toUpperCase() : piece[1].toLowerCase();
          rowStr += ch;
        }
      }
      if (empty > 0) rowStr += empty;
      rows.push(rowStr);
    }

    let castlingStr = '';
    if (this.castling.wK) castlingStr += 'K';
    if (this.castling.wQ) castlingStr += 'Q';
    if (this.castling.bK) castlingStr += 'k';
    if (this.castling.bQ) castlingStr += 'q';
    if (!castlingStr) castlingStr = '-';

    const epStr = this.enPassant ? ChessEngine.coordToSquare(this.enPassant.r, this.enPassant.c) : '-';

    return `${rows.join('/')} ${this.turn} ${castlingStr} ${epStr} ${this.halfMoves} ${this.moveNumber}`;
  }

  isSquareAttacked(r, c, byColor) {
    // 1. Pawn attacks
    const pawnDir = byColor === 'w' ? 1 : -1; // White pawn attacks from r+1, Black from r-1
    const pR = r + pawnDir;
    if (pR >= 0 && pR <= 7) {
      if (c - 1 >= 0 && this.board[pR][c - 1] === byColor + 'P') return true;
      if (c + 1 <= 7 && this.board[pR][c + 1] === byColor + 'P') return true;
    }

    // 2. Knight attacks
    const knightOffsets = [
      [-2, -1], [-2, 1], [-1, -2], [-1, 2],
      [1, -2], [1, 2], [2, -1], [2, 1]
    ];
    for (const [dr, dc] of knightOffsets) {
      const nr = r + dr;
      const nc = c + dc;
      if (nr >= 0 && nr <= 7 && nc >= 0 && nc <= 7) {
        if (this.board[nr][nc] === byColor + 'N') return true;
      }
    }

    // 3. King attacks
    const kingOffsets = [
      [-1, -1], [-1, 0], [-1, 1],
      [0, -1],           [0, 1],
      [1, -1],  [1, 0],  [1, 1]
    ];
    for (const [dr, dc] of kingOffsets) {
      const nr = r + dr;
      const nc = c + dc;
      if (nr >= 0 && nr <= 7 && nc >= 0 && nc <= 7) {
        if (this.board[nr][nc] === byColor + 'K') return true;
      }
    }

    // 4. Sliding pieces (Rook/Queen orthogonals)
    const ortho = [[-1, 0], [1, 0], [0, -1], [0, 1]];
    for (const [dr, dc] of ortho) {
      let nr = r + dr;
      let nc = c + dc;
      while (nr >= 0 && nr <= 7 && nc >= 0 && nc <= 7) {
        const piece = this.board[nr][nc];
        if (piece) {
          if (piece[0] === byColor && (piece[1] === 'R' || piece[1] === 'Q')) return true;
          break; // Blocked
        }
        nr += dr;
        nc += dc;
      }
    }

    // 5. Sliding pieces (Bishop/Queen diagonals)
    const diag = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
    for (const [dr, dc] of diag) {
      let nr = r + dr;
      let nc = c + dc;
      while (nr >= 0 && nr <= 7 && nc >= 0 && nc <= 7) {
        const piece = this.board[nr][nc];
        if (piece) {
          if (piece[0] === byColor && (piece[1] === 'B' || piece[1] === 'Q')) return true;
          break; // Blocked
        }
        nr += dr;
        nc += dc;
      }
    }

    return false;
  }

  findKing(color) {
    const target = color + 'K';
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        if (this.board[r][c] === target) return { r, c };
      }
    }
    return null;
  }

  isInCheck(color = this.turn) {
    const king = this.findKing(color);
    if (!king) return false;
    const opponent = color === 'w' ? 'b' : 'w';
    return this.isSquareAttacked(king.r, king.c, opponent);
  }

  generatePseudoMoves(color = this.turn) {
    const moves = [];
    const opp = color === 'w' ? 'b' : 'w';
    const pawnDir = color === 'w' ? -1 : 1;
    const startPawnRow = color === 'w' ? 6 : 1;
    const promoRow = color === 'w' ? 0 : 7;

    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = this.board[r][c];
        if (!piece || piece[0] !== color) continue;
        const type = piece[1];

        // PAWN
        if (type === 'P') {
          // 1 square forward
          const fwdR = r + pawnDir;
          if (fwdR >= 0 && fwdR <= 7 && !this.board[fwdR][c]) {
            if (fwdR === promoRow) {
              ['Q', 'R', 'B', 'N'].forEach(promo => {
                moves.push({ from: { r, c }, to: { r: fwdR, c }, piece, promo });
              });
            } else {
              moves.push({ from: { r, c }, to: { r: fwdR, c }, piece });
              // 2 squares forward
              const fwd2R = r + 2 * pawnDir;
              if (r === startPawnRow && !this.board[fwd2R][c]) {
                moves.push({ from: { r, c }, to: { r: fwd2R, c }, piece, isDoublePawn: true });
              }
            }
          }

          // Diagonal captures
          for (const dc of [-1, 1]) {
            const capC = c + dc;
            if (capC >= 0 && capC <= 7 && fwdR >= 0 && fwdR <= 7) {
              const targetPiece = this.board[fwdR][capC];
              if (targetPiece && targetPiece[0] === opp) {
                if (fwdR === promoRow) {
                  ['Q', 'R', 'B', 'N'].forEach(promo => {
                    moves.push({ from: { r, c }, to: { r: fwdR, c: capC }, piece, captured: targetPiece, promo });
                  });
                } else {
                  moves.push({ from: { r, c }, to: { r: fwdR, c: capC }, piece, captured: targetPiece });
                }
              } else if (this.enPassant && this.enPassant.r === fwdR && this.enPassant.c === capC) {
                // En Passant
                moves.push({
                  from: { r, c },
                  to: { r: fwdR, c: capC },
                  piece,
                  isEnPassant: true,
                  captured: opp + 'P'
                });
              }
            }
          }
        }

        // KNIGHT
        else if (type === 'N') {
          const offsets = [
            [-2, -1], [-2, 1], [-1, -2], [-1, 2],
            [1, -2], [1, 2], [2, -1], [2, 1]
          ];
          for (const [dr, dc] of offsets) {
            const nr = r + dr;
            const nc = c + dc;
            if (nr >= 0 && nr <= 7 && nc >= 0 && nc <= 7) {
              const dest = this.board[nr][nc];
              if (!dest) {
                moves.push({ from: { r, c }, to: { r: nr, c: nc }, piece });
              } else if (dest[0] === opp) {
                moves.push({ from: { r, c }, to: { r: nr, c: nc }, piece, captured: dest });
              }
            }
          }
        }

        // BISHOP / ROOK / QUEEN
        else if (type === 'B' || type === 'R' || type === 'Q') {
          const dirs = [];
          if (type === 'R' || type === 'Q') dirs.push([-1, 0], [1, 0], [0, -1], [0, 1]);
          if (type === 'B' || type === 'Q') dirs.push([-1, -1], [-1, 1], [1, -1], [1, 1]);

          for (const [dr, dc] of dirs) {
            let nr = r + dr;
            let nc = c + dc;
            while (nr >= 0 && nr <= 7 && nc >= 0 && nc <= 7) {
              const dest = this.board[nr][nc];
              if (!dest) {
                moves.push({ from: { r, c }, to: { r: nr, c: nc }, piece });
              } else {
                if (dest[0] === opp) {
                  moves.push({ from: { r, c }, to: { r: nr, c: nc }, piece, captured: dest });
                }
                break; // Blocked
              }
              nr += dr;
              nc += dc;
            }
          }
        }

        // KING
        else if (type === 'K') {
          const offsets = [
            [-1, -1], [-1, 0], [-1, 1],
            [0, -1],           [0, 1],
            [1, -1],  [1, 0],  [1, 1]
          ];
          for (const [dr, dc] of offsets) {
            const nr = r + dr;
            const nc = c + dc;
            if (nr >= 0 && nr <= 7 && nc >= 0 && nc <= 7) {
              const dest = this.board[nr][nc];
              if (!dest) {
                moves.push({ from: { r, c }, to: { r: nr, c: nc }, piece });
              } else if (dest[0] === opp) {
                moves.push({ from: { r, c }, to: { r: nr, c: nc }, piece, captured: dest });
              }
            }
          }

          // Castling
          if (color === 'w' && r === 7 && c === 4) {
            // White Kingside (e1 -> g1)
            if (this.castling.wK && !this.board[7][5] && !this.board[7][6] && this.board[7][7] === 'wR') {
              if (!this.isSquareAttacked(7, 4, 'b') && !this.isSquareAttacked(7, 5, 'b') && !this.isSquareAttacked(7, 6, 'b')) {
                moves.push({ from: { r: 7, c: 4 }, to: { r: 7, c: 6 }, piece, isCastleK: true });
              }
            }
            // White Queenside (e1 -> c1)
            if (this.castling.wQ && !this.board[7][1] && !this.board[7][2] && !this.board[7][3] && this.board[7][0] === 'wR') {
              if (!this.isSquareAttacked(7, 4, 'b') && !this.isSquareAttacked(7, 3, 'b') && !this.isSquareAttacked(7, 2, 'b')) {
                moves.push({ from: { r: 7, c: 4 }, to: { r: 7, c: 2 }, piece, isCastleQ: true });
              }
            }
          } else if (color === 'b' && r === 0 && c === 4) {
            // Black Kingside (e8 -> g8)
            if (this.castling.bK && !this.board[0][5] && !this.board[0][6] && this.board[0][7] === 'bR') {
              if (!this.isSquareAttacked(0, 4, 'w') && !this.isSquareAttacked(0, 5, 'w') && !this.isSquareAttacked(0, 6, 'w')) {
                moves.push({ from: { r: 0, c: 4 }, to: { r: 0, c: 6 }, piece, isCastleK: true });
              }
            }
            // Black Queenside (e8 -> c8)
            if (this.castling.bQ && !this.board[0][1] && !this.board[0][2] && !this.board[0][3] && this.board[0][0] === 'bR') {
              if (!this.isSquareAttacked(0, 4, 'w') && !this.isSquareAttacked(0, 3, 'w') && !this.isSquareAttacked(0, 2, 'w')) {
                moves.push({ from: { r: 0, c: 4 }, to: { r: 0, c: 2 }, piece, isCastleQ: true });
              }
            }
          }
        }
      }
    }

    return moves;
  }

  makeMove(move, validate = false) {
    if (validate) {
      const legalMoves = this.getLegalMoves();
      const match = legalMoves.find(m => 
        m.from.r === move.from.r && m.from.c === move.from.c &&
        m.to.r === move.to.r && m.to.c === move.to.c &&
        (!m.promo || m.promo === (move.promo || 'Q'))
      );
      if (!match) return false;
      move = match;
    }

    // Snapshot state for undo
    const prevState = {
      board: this.board.map(row => [...row]),
      turn: this.turn,
      castling: { ...this.castling },
      enPassant: this.enPassant ? { ...this.enPassant } : null,
      halfMoves: this.halfMoves,
      moveNumber: this.moveNumber,
      move,
      fenBefore: this.toFEN()
    };

    const color = this.turn;
    const opp = color === 'w' ? 'b' : 'w';
    const piece = this.board[move.from.r][move.from.c];
    const type = piece[1];

    // Reset en passant by default
    this.enPassant = null;

    // Halfmove clock update (reset on pawn advance or capture)
    if (type === 'P' || move.captured) {
      this.halfMoves = 0;
    } else {
      this.halfMoves++;
    }

    // Move piece
    this.board[move.from.r][move.from.c] = null;

    if (move.isEnPassant) {
      // Remove captured pawn behind target
      const capPawnRow = color === 'w' ? move.to.r + 1 : move.to.r - 1;
      this.board[capPawnRow][move.to.c] = null;
      this.board[move.to.r][move.to.c] = piece;
    } else if (move.isCastleK) {
      this.board[move.to.r][move.to.c] = piece;
      // Move kingside rook
      const rRow = move.to.r;
      this.board[rRow][5] = this.board[rRow][7];
      this.board[rRow][7] = null;
    } else if (move.isCastleQ) {
      this.board[move.to.r][move.to.c] = piece;
      // Move queenside rook
      const rRow = move.to.r;
      this.board[rRow][3] = this.board[rRow][0];
      this.board[rRow][0] = null;
    } else if (move.promo) {
      this.board[move.to.r][move.to.c] = color + move.promo;
    } else {
      this.board[move.to.r][move.to.c] = piece;
    }

    // Set new en passant target if double pawn push
    if (move.isDoublePawn) {
      const epRow = color === 'w' ? move.from.r - 1 : move.from.r + 1;
      this.enPassant = { r: epRow, c: move.from.c };
    }

    // Update castling rights
    if (type === 'K') {
      if (color === 'w') {
        this.castling.wK = false;
        this.castling.wQ = false;
      } else {
        this.castling.bK = false;
        this.castling.bQ = false;
      }
    } else if (type === 'R') {
      if (color === 'w') {
        if (move.from.r === 7 && move.from.c === 7) this.castling.wK = false;
        if (move.from.r === 7 && move.from.c === 0) this.castling.wQ = false;
      } else {
        if (move.from.r === 0 && move.from.c === 7) this.castling.bK = false;
        if (move.from.r === 0 && move.from.c === 0) this.castling.bQ = false;
      }
    }

    // If opponent rook is captured in corner, revoke opponent's castling right
    if (move.to.r === 7 && move.to.c === 7) this.castling.wK = false;
    if (move.to.r === 7 && move.to.c === 0) this.castling.wQ = false;
    if (move.to.r === 0 && move.to.c === 7) this.castling.bK = false;
    if (move.to.r === 0 && move.to.c === 0) this.castling.bQ = false;

    // Switch turn
    this.turn = opp;
    if (color === 'b') {
      this.moveNumber++;
    }

    this.history.push(prevState);
    return true;
  }

  undo() {
    if (this.history.length === 0) return null;
    const prevState = this.history.pop();
    this.board = prevState.board;
    this.turn = prevState.turn;
    this.castling = prevState.castling;
    this.enPassant = prevState.enPassant;
    this.halfMoves = prevState.halfMoves;
    this.moveNumber = prevState.moveNumber;
    return prevState.move;
  }

  getLegalMoves(color = this.turn) {
    const pseudoMoves = this.generatePseudoMoves(color);
    const legalMoves = [];

    for (const move of pseudoMoves) {
      this.makeMove(move, false);
      // Verify our own king is safe
      if (!this.isInCheck(color)) {
        legalMoves.push(move);
      }
      this.undo();
    }

    return legalMoves;
  }

  isGameOver() {
    // King of the Hill variant check
    if (this.variant === 'koth') {
      const centerSquares = [[3, 3], [3, 4], [4, 3], [4, 4]];
      for (const [cr, cc] of centerSquares) {
        if (this.board[cr][cc] === 'wK') {
          return { gameOver: true, result: 'King of the Hill (White conquered center!)', winner: 'w' };
        }
        if (this.board[cr][cc] === 'bK') {
          return { gameOver: true, result: 'King of the Hill (Black conquered center!)', winner: 'b' };
        }
      }
    }

    const moves = this.getLegalMoves();
    const inCheck = this.isInCheck(this.turn);

    if (moves.length === 0) {
      if (inCheck) {
        return { gameOver: true, result: 'checkmate', winner: this.turn === 'w' ? 'b' : 'w' };
      } else {
        return { gameOver: true, result: 'stalemate', winner: null };
      }
    }

    if (this.halfMoves >= 100) {
      return { gameOver: true, result: '50-move rule draw', winner: null };
    }

    if (this.isInsufficientMaterial()) {
      return { gameOver: true, result: 'insufficient material draw', winner: null };
    }

    return { gameOver: false, inCheck };
  }

  isInsufficientMaterial() {
    const pieces = [];
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        if (this.board[r][c]) pieces.push({ piece: this.board[r][c], r, c });
      }
    }

    // King vs King
    if (pieces.length === 2) return true;

    // King + minor vs King
    if (pieces.length === 3) {
      const minor = pieces.find(p => p.piece[1] === 'B' || p.piece[1] === 'N');
      if (minor) return true;
    }

    // King + Bishop vs King + Bishop (same square color)
    if (pieces.length === 4) {
      const bishops = pieces.filter(p => p.piece[1] === 'B');
      if (bishops.length === 2 && bishops[0].piece[0] !== bishops[1].piece[0]) {
        const color1 = (bishops[0].r + bishops[0].c) % 2;
        const color2 = (bishops[1].r + bishops[1].c) % 2;
        if (color1 === color2) return true;
      }
    }

    return false;
  }

  moveToSAN(move) {
    if (move.isCastleK) return 'O-O';
    if (move.isCastleQ) return 'O-O-O';

    const pieceType = move.piece[1];
    const fromSq = ChessEngine.coordToSquare(move.from.r, move.from.c);
    const toSq = ChessEngine.coordToSquare(move.to.r, move.to.c);
    let san = '';

    if (pieceType === 'P') {
      if (move.captured || move.isEnPassant) {
        san = fromSq[0] + 'x' + toSq;
      } else {
        san = toSq;
      }
      if (move.promo) {
        san += '=' + move.promo;
      }
    } else {
      san = pieceType;
      // Disambiguation
      const legalMoves = this.getLegalMoves(move.piece[0]);
      const duplicates = legalMoves.filter(m => 
        m.piece === move.piece &&
        m.to.r === move.to.r && m.to.c === move.to.c &&
        (m.from.r !== move.from.r || m.from.c !== move.from.c)
      );

      if (duplicates.length > 0) {
        const sameFile = duplicates.some(m => m.from.c === move.from.c);
        const sameRank = duplicates.some(m => m.from.r === move.from.r);

        if (!sameFile) {
          san += fromSq[0];
        } else if (!sameRank) {
          san += fromSq[1];
        } else {
          san += fromSq;
        }
      }

      if (move.captured) san += 'x';
      san += toSq;
    }

    // Check / Checkmate suffix
    this.makeMove(move, false);
    const inCheck = this.isInCheck(this.turn);
    const hasLegal = this.getLegalMoves().length > 0;
    this.undo();

    if (inCheck) {
      san += hasLegal ? '+' : '#';
    }

    return san;
  }
}
