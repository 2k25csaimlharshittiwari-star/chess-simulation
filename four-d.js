/**
 * 4D Hypercube & Quantum Dimension Visualizer
 * Projects a true 4-dimensional tesseract rotating through 4D space (XW, YZ planes)
 * with quantum warp particles, dimensional coordinates, and hyperspace perspective.
 */

class FourDDimensionEngine {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas ? canvas.getContext('2d') : null;
    this.active = false;
    this.angleXW = 0;
    this.angleYZ = 0;
    this.angleZW = 0;
    this.particles = [];
    this.animId = null;

    // Define 16 vertices of a 4D Hypercube (Tesseract) with coordinates (x, y, z, w) where each is -1 or 1
    this.vertices4D = [];
    for (let x = -1; x <= 1; x += 2) {
      for (let y = -1; y <= 1; y += 2) {
        for (let z = -1; z <= 1; z += 2) {
          for (let w = -1; w <= 1; w += 2) {
            this.vertices4D.push([x, y, z, w]);
          }
        }
      }
    }

    // Connect pairs of vertices that differ in exactly one coordinate (32 edges of a tesseract)
    this.edges = [];
    for (let i = 0; i < 16; i++) {
      for (let j = i + 1; j < 16; j++) {
        let diff = 0;
        for (let k = 0; k < 4; k++) {
          if (this.vertices4D[i][k] !== this.vertices4D[j][k]) diff++;
        }
        if (diff === 1) {
          this.edges.push([i, j]);
        }
      }
    }

    if (canvas) {
      this.initParticles();
      this.resize();
      window.addEventListener('resize', () => this.resize());
    }
  }

  initParticles() {
    this.particles = [];
    for (let i = 0; i < 90; i++) {
      this.particles.push({
        x: (Math.random() - 0.5) * 1200,
        y: (Math.random() - 0.5) * 1200,
        z: Math.random() * 800 + 100,
        w: Math.random() * Math.PI * 2,
        size: Math.random() * 2 + 1,
        color: Math.random() > 0.5 ? '#38bdf8' : '#c084fc'
      });
    }
  }

  resize() {
    if (!this.canvas) return;
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  toggle() {
    this.active = !this.active;
    if (this.active) {
      document.body.classList.add('mode-4d');
      this.start();
    } else {
      document.body.classList.remove('mode-4d');
      this.stop();
    }
    return this.active;
  }

  start() {
    if (!this.animId) {
      this.loop();
    }
  }

  stop() {
    if (this.animId) {
      cancelAnimationFrame(this.animId);
      this.animId = null;
    }
    if (this.ctx) {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
  }

  /**
   * 4D Rotation in XW and YZ planes + perspective projection down to 2D
   */
  project4Dto2D(point, cx, cy, scale = 140) {
    let [x, y, z, w] = point;

    // Rotate in XW plane (4th dimension rotation!)
    const cosXW = Math.cos(this.angleXW);
    const sinXW = Math.sin(this.angleXW);
    const x1 = x * cosXW - w * sinXW;
    const w1 = x * sinXW + w * cosXW;

    // Rotate in YZ plane
    const cosYZ = Math.cos(this.angleYZ);
    const sinYZ = Math.sin(this.angleYZ);
    const y1 = y * cosYZ - z * sinYZ;
    const z1 = y * sinYZ + z * cosYZ;

    // Rotate in ZW plane
    const cosZW = Math.cos(this.angleZW);
    const sinZW = Math.sin(this.angleZW);
    const z2 = z1 * cosZW - w1 * sinZW;
    const w2 = z1 * sinZW + w1 * cosZW;

    // 4D -> 3D perspective projection (camera distance dw in 4th dim)
    const dw = 2.8;
    const projW = 1 / (dw - w2);
    const x3D = x1 * projW;
    const y3D = y1 * projW;
    const z3D = z2 * projW;

    // 3D -> 2D perspective projection
    const dz = 3.2;
    const projZ = 1 / (dz - z3D);
    const x2D = cx + x3D * projZ * scale;
    const y2D = cy + y3D * projZ * scale;

    return { x: x2D, y: y2D, w: w2 };
  }

  loop() {
    if (!this.active || !this.ctx) return;

    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    const w = this.canvas.width;
    const h = this.canvas.height;
    const cx = w / 2;
    const cy = h / 2;

    // Increment 4D hyper-angles
    this.angleXW += 0.012;
    this.angleYZ += 0.008;
    this.angleZW += 0.005;

    // 1. Draw Quantum Warp Particles in background
    for (const p of this.particles) {
      p.z -= 2;
      p.w += 0.01;
      if (p.z <= 10) p.z = 800;

      const fov = 350 / p.z;
      const px = cx + p.x * fov;
      const py = cy + p.y * fov;

      if (px >= 0 && px <= w && py >= 0 && py <= h) {
        const alpha = Math.min(1, (800 - p.z) / 400);
        this.ctx.fillStyle = p.color;
        this.ctx.globalAlpha = alpha * 0.7;
        this.ctx.beginPath();
        this.ctx.arc(px, py, p.size * fov, 0, Math.PI * 2);
        this.ctx.fill();
      }
    }

    // 2. Project and draw rotating 4D Tesseract (Hypercube)
    const projected = this.vertices4D.map(v => this.project4Dto2D(v, cx, cy, Math.min(w, h) * 0.42));

    // Draw hypercube edges with glowing chromatic gradient
    this.ctx.lineWidth = 1.8;
    this.ctx.shadowBlur = 12;

    for (const [i, j] of this.edges) {
      const p1 = projected[i];
      const p2 = projected[j];

      const grad = this.ctx.createLinearGradient(p1.x, p1.y, p2.x, p2.y);
      const alpha1 = Math.max(0.15, 0.5 + p1.w * 0.35);
      const alpha2 = Math.max(0.15, 0.5 + p2.w * 0.35);

      grad.addColorStop(0, `rgba(56, 189, 248, ${alpha1})`);
      grad.addColorStop(1, `rgba(192, 132, 252, ${alpha2})`);

      this.ctx.strokeStyle = grad;
      this.ctx.shadowColor = '#38bdf8';
      this.ctx.beginPath();
      this.ctx.moveTo(p1.x, p1.y);
      this.ctx.lineTo(p2.x, p2.y);
      this.ctx.stroke();
    }

    // Draw glowing 4D node vertices
    for (const pt of projected) {
      this.ctx.shadowBlur = 16;
      this.ctx.shadowColor = '#c084fc';
      this.ctx.fillStyle = '#ffffff';
      this.ctx.beginPath();
      this.ctx.arc(pt.x, pt.y, 3.2, 0, Math.PI * 2);
      this.ctx.fill();
    }

    this.ctx.shadowBlur = 0;
    this.ctx.globalAlpha = 1;

    this.animId = requestAnimationFrame(() => this.loop());
  }
}
