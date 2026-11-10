/**
 * Particle & Visual FX Engine for Chess
 * Renders capture explosions, move ripples, check aura, and screen shake.
 */

class ChessFX {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas ? canvas.getContext('2d') : null;
    this.particles = [];
    this.ripples = [];
    this.animId = null;
    this.enabled = true;
    this.boardEl = null;

    if (canvas) {
      this.resize();
      window.addEventListener('resize', () => this.resize());
      this.loop();
    }
  }

  setBoardElement(el) {
    this.boardEl = el;
  }

  resize() {
    if (!this.canvas) return;
    const rect = this.canvas.parentElement.getBoundingClientRect();
    this.canvas.width = rect.width;
    this.canvas.height = rect.height;
  }

  screenShake(intensity = 6, durationMs = 250) {
    if (!this.boardEl || !this.enabled) return;
    const start = performance.now();
    const origTransform = this.boardEl.style.transform || '';

    const shake = (now) => {
      const elapsed = now - start;
      if (elapsed < durationMs) {
        const decay = 1 - elapsed / durationMs;
        const dx = (Math.random() - 0.5) * intensity * decay;
        const dy = (Math.random() - 0.5) * intensity * decay;
        this.boardEl.style.transform = `translate(${dx}px, ${dy}px)`;
        requestAnimationFrame(shake);
      } else {
        this.boardEl.style.transform = '';
      }
    };
    requestAnimationFrame(shake);
  }

  spawnCaptureBurst(x, y, color = '#f59e0b', count = 30) {
    if (!this.enabled) return;
    const palette = color === 'w' ? ['#ffffff', '#38bdf8', '#818cf8', '#facc15'] : ['#f43f5e', '#fb923c', '#e11d48', '#881337'];
    
    // Spark particles
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 6;
      const size = 3 + Math.random() * 4;
      const pColor = palette[Math.floor(Math.random() * palette.length)];

      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size,
        color: pColor,
        alpha: 1,
        decay: 0.02 + Math.random() * 0.03,
        gravity: 0.12,
        spin: (Math.random() - 0.5) * 0.2,
        angle: 0
      });
    }

    // Expanding shockwave ripple
    this.ripples.push({
      x,
      y,
      radius: 5,
      maxRadius: 55,
      color: color === 'w' ? 'rgba(56, 189, 248, 0.8)' : 'rgba(244, 63, 94, 0.8)',
      lineWidth: 4,
      alpha: 1
    });

    this.screenShake(8, 220);
  }

  spawnMoveRipple(x, y, color = '#38bdf8') {
    if (!this.enabled) return;
    this.ripples.push({
      x,
      y,
      radius: 4,
      maxRadius: 36,
      color: 'rgba(56, 189, 248, 0.7)',
      lineWidth: 2.5,
      alpha: 0.9
    });

    // Subtle dust sparkles
    for (let i = 0; i < 8; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 0.8 + Math.random() * 1.8;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 0.5,
        size: 2 + Math.random() * 2,
        color: '#bae6fd',
        alpha: 0.8,
        decay: 0.04,
        gravity: 0.05
      });
    }
  }

  loop() {
    if (!this.ctx) return;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Render & Update Ripples
    for (let i = this.ripples.length - 1; i >= 0; i--) {
      const rip = this.ripples[i];
      this.ctx.save();
      this.ctx.beginPath();
      this.ctx.arc(rip.x, rip.y, rip.radius, 0, Math.PI * 2);
      this.ctx.strokeStyle = rip.color.replace(/[\d\.]+\)$/, `${rip.alpha})`);
      this.ctx.lineWidth = rip.lineWidth;
      this.ctx.stroke();
      this.ctx.restore();

      rip.radius += 2.2;
      rip.alpha -= 0.038;
      if (rip.alpha <= 0 || rip.radius >= rip.maxRadius) {
        this.ripples.splice(i, 1);
      }
    }

    // Render & Update Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += p.gravity || 0;
      p.alpha -= p.decay;
      if (p.angle !== undefined) p.angle += p.spin || 0;

      if (p.alpha <= 0) {
        this.particles.splice(i, 1);
        continue;
      }

      this.ctx.save();
      this.ctx.globalAlpha = Math.max(0, p.alpha);
      this.ctx.fillStyle = p.color;
      this.ctx.shadowColor = p.color;
      this.ctx.shadowBlur = 6;

      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.restore();
    }

    this.animId = requestAnimationFrame(() => this.loop());
  }
}
