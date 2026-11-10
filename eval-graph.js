/**
 * Live Advantage Timeline Graph (Evaluation Sparkline Canvas)
 * Visualizes the pendulum of game advantage over the course of moves
 */

class EvalGraph {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas ? canvas.getContext('2d') : null;
    this.evalHistory = [0]; // starts at 0

    if (canvas) {
      this.resize();
      window.addEventListener('resize', () => {
        this.resize();
        this.draw();
      });
    }
  }

  resize() {
    if (!this.canvas) return;
    const rect = this.canvas.parentElement.getBoundingClientRect();
    this.canvas.width = rect.width;
    this.canvas.height = 70;
  }

  reset() {
    this.evalHistory = [0];
    this.draw();
  }

  pushEval(score) {
    // Clamp score to [-1000, 1000] for display
    const clamped = Math.max(-1000, Math.min(1000, score));
    this.evalHistory.push(clamped);
    this.draw();
  }

  popEval() {
    if (this.evalHistory.length > 1) {
      this.evalHistory.pop();
      this.draw();
    }
  }

  draw() {
    if (!this.ctx || !this.canvas) return;
    const w = this.canvas.width;
    const h = this.canvas.height;
    const ctx = this.ctx;

    ctx.clearRect(0, 0, w, h);

    // Center equilibrium line (0.0)
    const midY = h / 2;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(0, midY);
    ctx.lineTo(w, midY);
    ctx.stroke();
    ctx.setLineDash([]);

    if (this.evalHistory.length < 2) return;

    const points = [];
    const stepX = w / Math.max(20, this.evalHistory.length - 1);

    for (let i = 0; i < this.evalHistory.length; i++) {
      const score = this.evalHistory[i];
      const x = i * stepX;
      // Map [-1000, 1000] to [h - 4, 4]
      const y = midY - (score / 1000) * (midY - 6);
      points.push({ x, y, score });
    }

    // Fill gradient area
    const lastPt = points[points.length - 1];
    const isWhiteAdv = lastPt.score >= 0;

    ctx.beginPath();
    ctx.moveTo(points[0].x, midY);
    for (const pt of points) {
      ctx.lineTo(pt.x, pt.y);
    }
    ctx.lineTo(lastPt.x, midY);
    ctx.closePath();

    const gradient = ctx.createLinearGradient(0, 0, 0, h);
    if (isWhiteAdv) {
      gradient.addColorStop(0, 'rgba(56, 189, 248, 0.45)');
      gradient.addColorStop(0.5, 'rgba(56, 189, 248, 0.05)');
      gradient.addColorStop(1, 'rgba(244, 63, 94, 0.1)');
    } else {
      gradient.addColorStop(0, 'rgba(56, 189, 248, 0.1)');
      gradient.addColorStop(0.5, 'rgba(244, 63, 94, 0.05)');
      gradient.addColorStop(1, 'rgba(244, 63, 94, 0.45)');
    }
    ctx.fillStyle = gradient;
    ctx.fill();

    // Line stroke
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      // Smooth curve
      const prev = points[i - 1];
      const curr = points[i];
      const cpx = (prev.x + curr.x) / 2;
      ctx.quadraticCurveTo(prev.x, prev.y, cpx, (prev.y + curr.y) / 2);
    }
    ctx.lineTo(lastPt.x, lastPt.y);

    ctx.strokeStyle = isWhiteAdv ? '#38bdf8' : '#f43f5e';
    ctx.lineWidth = 2.2;
    ctx.shadowColor = isWhiteAdv ? '#38bdf8' : '#f43f5e';
    ctx.shadowBlur = 8;
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Glowing dot at the current tip
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(lastPt.x, lastPt.y, 3.5, 0, Math.PI * 2);
    ctx.fill();
  }
}
