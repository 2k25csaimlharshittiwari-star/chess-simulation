# ♟️ Grandmaster Chess & 4D AI Simulator

An interactive, responsive, and hyper-dynamic Chess game and AI simulation engine built with pure modern web technologies (HTML5 Canvas, Vector SVGs, CSS3 3D/4D Hypercube transformations, and Vanilla JavaScript).

---

## 🌟 Key Updates

### 1. 🎛️ Unified Dimension Selector (2D / 3D / 4D)
Instead of cluttered multiple toggle buttons, select your preferred perspective from a single sleek header dropdown:
- **2D Classic**: Clean, traditional tournament board with crisp vector pieces.
- **3D Isometric**: Dynamic depth tilt (`rotateX` / `rotateZ`), piece elevation, and realistic drop shadows.
- **4D Hypercube**: Activates the **Quantum Matrix Engine** — rotates a true 16-vertex/32-edge 4D tesseract in background hyperspace with quantum warp particles, continuous hyper-breathing board oscillation, and chromatic neon glows.

### 2. ⏺️ User-Controlled Match Recording (OFF by Default)
- **Zero Background Intrusion**: Recording is **OFF by default** so you can play casually without recording overhead or clutter.
- **Enable on Demand**: Click **Record Match** in the header at any time to begin logging:
  - Activates the live `● REC 00:00` timer badge in the header.
  - Captures every move, timestamp, board state, and evaluation delta.
- **Click to Stop**: Clicking the button again turns recording off and summarizes captured moves.
- **Post-Game AI Review Theater**:
  - Click **Review Game** (in the header or upon checkmate) to view:
    - **Accuracy Percentages** for White and Black.
    - **Move Classification Breakdown**: 💎 Brilliant, ⭐ Best Move, ✓ Excellent, ?! Inaccuracy, ? Mistake, ?? Blunder.
    - **Coach's Executive Summary**: High-level analysis of turning points and strategic errors.
    - **Interactive Replay Scrubber**: Scrub through every ply, step forward/backward, or autoplay a match replay with move badges on the board!

### 3. 🕊️ Smooth Gliding Piece Movement
- Pieces levitate and glide smoothly across squares with kinetic drop shadows and glowing quantum trails rather than teleporting.

---

## 🌟 Full Suite of Features

- **🗺️ Territory Control Heatmap**: Real-time raycasting influence map showing White (cyan), Black (crimson), and contested (amber) zones.
- **💥 Particle FX & Screen Shake**: Kinetic shockwaves and spark bursts on captures.
- **🎙️ Live AI Tactical Commentator**: Real-time ticker identifying openings, checks, queen trades, and forks.
- **📈 Advantage Timeline Graph**: Live sparkline plotting the advantage pendulum across all moves.
- **🎲 Fischer Random (Chess960) & 👑 King of the Hill**: One-click Chess960 generation and KotH center-conquest variant.
- **🤖 AI vs AI Simulation Mode**: Watch two computer engines battle with customizable speeds and depths.
- **🔊 Zero-Asset Procedural Audio**: Move, capture, check, and checkmate sound effects built into Web Audio API.

---

## 🚀 How to Launch

### Method 1: Direct in Any Browser (Zero Installation)
Simply open [index.html](file:///C:/Users/asus/.gemini/antigravity/scratch/chess-simulation/index.html) in your favorite web browser (Chrome, Edge, Firefox, Brave, Safari).

### Method 2: Local HTTP Server (Optional)
Open PowerShell in this directory and run:
```powershell
cd "C:\Users\asus\.gemini\antigravity\scratch\chess-simulation"
python -m http.server 8000
```
Then navigate to `http://localhost:8000`.

---

## 📂 Project Architecture

```
chess-simulation/
├── index.html        # App UI, 4D canvas, Review modal, board, and panels
├── style.css         # 3D/4D transformations, animations, and dark glassmorphic themes
├── four-d.js         # 4D Hypercube tesseract projection & quantum particle warp engine
├── recorder-review.js# Match recording, accuracy engine, and replay theater
├── fx.js             # Canvas particle physics, ripples, and screen shake
├── heatmap.js        # Real-time raycasting territory control visualizer
├── commentary.js     # Live tactical commentary & opening book narrator
├── eval-graph.js     # Advantage timeline sparkline canvas
├── pieces.js         # Vector SVG chess pieces
├── audio.js          # Procedural Web Audio API sound synthesizer
├── chess-engine.js   # Move generation, Check/Checkmate, Chess960, and KotH
├── ai.js             # Minimax algorithm, Alpha-Beta pruning, Quiescence, and PST
├── app.js            # Main controller, smooth animations, and interaction bindings
└── README.md         # Documentation & guide
```
