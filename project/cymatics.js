// ─────────────────────────────────────────────────────────────────
// Cymatic / node-point animations
// Each sprite is a canvas-based generative pattern that relates
// to the concept of the video.
// ─────────────────────────────────────────────────────────────────

(function(){
  'use strict';

  // Map of concept → renderer
  const RENDERERS = {};

  // ── 1. MULTITASKING — Four concurrent orbits around a shared core
  //    Multiple signals moving in parallel but staying coherent.
  RENDERERS.multitasking = function(ctx, t, w, h, opts){
    const cx = w/2, cy = h/2;
    const R = Math.min(w,h)*0.42;
    ctx.clearRect(0,0,w,h);

    // central node (the agent)
    ctx.fillStyle = opts.accent;
    ctx.beginPath();
    ctx.arc(cx, cy, 3.5, 0, Math.PI*2);
    ctx.fill();

    // concentric rings of parallel tasks
    const tracks = 4;
    for (let i=0; i<tracks; i++){
      const r = R*(0.32 + i*0.22);
      const phase = t*0.6 + i*1.3;
      const speed = 1 - i*0.15;

      // faint ring
      ctx.strokeStyle = opts.line;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI*2);
      ctx.stroke();

      // moving node on the ring
      const a = phase * speed;
      const nx = cx + Math.cos(a)*r;
      const ny = cy + Math.sin(a)*r;

      // connector line
      ctx.strokeStyle = opts.accent;
      ctx.lineWidth = 1.5;
      ctx.globalAlpha = 0.35 + 0.3*Math.sin(t*1.2 + i);
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(nx, ny);
      ctx.stroke();
      ctx.globalAlpha = 1;

      // node
      ctx.fillStyle = opts.accent;
      ctx.beginPath();
      ctx.arc(nx, ny, 2.5, 0, Math.PI*2);
      ctx.fill();

      // trailing pulse
      for (let k=1; k<5; k++){
        const ta = a - k*0.08;
        const tx = cx + Math.cos(ta)*r;
        const ty = cy + Math.sin(ta)*r;
        ctx.fillStyle = opts.accent;
        ctx.globalAlpha = (5-k)/12;
        ctx.beginPath();
        ctx.arc(tx, ty, 1.5, 0, Math.PI*2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }
  };

  // ── 2. MEMORY — Standing wave pattern that accumulates
  //    Chladni-style node lines that settle into shape.
  RENDERERS.memory = function(ctx, t, w, h, opts){
    ctx.clearRect(0,0,w,h);
    const step = 6;
    const cx = w/2, cy = h/2;

    // standing wave — cymatic interference pattern
    const k1 = 0.06 + 0.008*Math.sin(t*0.25);
    const k2 = 0.09 + 0.008*Math.cos(t*0.2);
    const phase = t*0.35;

    ctx.fillStyle = opts.line;

    // Sample symmetrically around the canvas center so the pattern is always
    // visually balanced regardless of the slot's aspect ratio.
    const halfW = Math.floor(w/2/step)*step;
    const halfH = Math.floor(h/2/step)*step;
    for (let dx = -halfW; dx <= halfW; dx += step){
      for (let dy = -halfH; dy <= halfH; dy += step){
        // two interfering sine patterns — the classic Chladni math
        const v = Math.cos(dx*k1)*Math.cos(dy*k1 + phase)
                + Math.cos(dx*k2 + phase*0.7)*Math.cos(dy*k2);
        const a = Math.max(0, 1 - Math.abs(v)*1.6);
        if (a < 0.05) continue;
        ctx.globalAlpha = a;
        ctx.beginPath();
        ctx.arc(cx + dx, cy + dy, 1.1, 0, Math.PI*2);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;

    // Stable, centered highlight rings — no drift, just subtle breathing.
    ctx.strokeStyle = opts.accent;
    ctx.lineWidth = 1.2;
    for (let i=0; i<3; i++){
      const r = 10 + i*18 + (Math.sin(t*0.8 + i)*3);
      ctx.globalAlpha = 0.4 - i*0.1;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI*2);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  };

  // ── 3. SKILLS — Spectrum: ordered grid → chaotic particles
  //    Shows the controlled → autonomous spectrum.
  RENDERERS.skills = function(ctx, t, w, h, opts){
    ctx.clearRect(0,0,w,h);
    const cols = 9, rows = 9;
    const mx = w*0.08, my = h*0.08;
    const gx = (w - 2*mx)/(cols-1);
    const gy = (h - 2*my)/(rows-1);

    // each node drifts from grid position (controlled) to free (autonomous)
    // based on its column — left = locked, right = free
    for (let i=0; i<cols; i++){
      for (let j=0; j<rows; j++){
        const gridX = mx + i*gx;
        const gridY = my + j*gy;

        // freedom factor rises across columns
        const freedom = i/(cols-1);
        const noise = Math.sin(t*1.1 + i*1.7 + j*2.3) * 8 * freedom
                    + Math.cos(t*0.8 + i*0.9 + j*1.4) * 6 * freedom;
        const noiseY = Math.cos(t*1.3 + i*2.1 + j*1.6) * 8 * freedom
                    + Math.sin(t*0.7 + i*1.2 + j*2.4) * 6 * freedom;

        const x = gridX + noise;
        const y = gridY + noiseY;

        // draw line to neighbor right (weakens as freedom rises)
        if (i < cols-1){
          const nGridX = mx + (i+1)*gx;
          const nFreedom = (i+1)/(cols-1);
          const nNoise = Math.sin(t*1.1 + (i+1)*1.7 + j*2.3) * 8 * nFreedom
                      + Math.cos(t*0.8 + (i+1)*0.9 + j*1.4) * 6 * nFreedom;
          const nNoiseY = Math.cos(t*1.3 + (i+1)*2.1 + j*1.6) * 8 * nFreedom
                      + Math.sin(t*0.7 + (i+1)*1.2 + j*2.4) * 6 * nFreedom;
          ctx.strokeStyle = opts.line;
          ctx.globalAlpha = Math.max(0.05, 0.7 - freedom*0.6);
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(nGridX + nNoise, gridY + nNoiseY);
          ctx.stroke();
        }

        // node
        const isAccent = freedom > 0.7 && (Math.sin(t*2 + i*j) > 0.3);
        ctx.fillStyle = isAccent ? opts.accent : opts.line;
        ctx.globalAlpha = 0.3 + freedom*0.7;
        ctx.beginPath();
        ctx.arc(x, y, 1.6, 0, Math.PI*2);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
  };

  // ── 4. SELF-IMPROVING — Concentric orbital rings, slowly rotating.
  //    A stable 3:2 Lissajous reads clearly as three connected rings
  //    that subtly rotate forward in time — a continuous feedback loop.
  RENDERERS['self-improving'] = function(ctx, t, w, h, opts){
    ctx.clearRect(0,0,w,h);
    const cx = w/2, cy = h/2;
    const R = Math.min(w,h)*0.36;

    // Integer a/b → curve always closes cleanly; slow delta → calm rotation.
    const a = 3, b = 2;
    const delta = t*0.12;

    const steps = 280;

    // Three concentric, nested trails — form a set of connected rings.
    for (let k=0; k<3; k++){
      const scale = 1 - k*0.14;
      ctx.strokeStyle = k === 0 ? opts.accent : opts.line;
      ctx.globalAlpha = k === 0 ? 0.9 : (0.42 - k*0.12);
      ctx.lineWidth = k === 0 ? 1.3 : 1;
      ctx.beginPath();
      for (let i=0; i<=steps; i++){
        const u = (i/steps)*Math.PI*2;
        const x = cx + Math.sin(a*u + delta)*R*scale;
        const y = cy + Math.sin(b*u)*R*scale;
        if (i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
      }
      ctx.closePath();
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    // A single node tracing the outer curve — the current pass of the loop.
    const u = (t*0.22) % (Math.PI*2);
    const mx = cx + Math.sin(a*u + delta)*R;
    const my = cy + Math.sin(b*u)*R;
    ctx.fillStyle = opts.accent;
    ctx.globalAlpha = 0.95;
    ctx.beginPath();
    ctx.arc(mx, my, 2.6, 0, Math.PI*2);
    ctx.fill();

    // Faint halo on the travelling node
    ctx.globalAlpha = 0.28;
    ctx.beginPath();
    ctx.arc(mx, my, 6, 0, Math.PI*2);
    ctx.fill();
    ctx.globalAlpha = 1;
  };

  // ── 5. ORCHESTRATION (coming soon) — dense star lattice with
  // layered, looping motion:
  //   · A radial burst travels outward from the centre (the "opening").
  //   · A second, directional drift wave is always running in parallel,
  //     whose angle rotates slowly — so over the cycle you see the
  //     field sweep left-to-right, diagonal, vertical, and back.
  //   · A slow cross-fade breathes between the two modes, so the
  //     composition visibly moves through phases rather than looping
  //     the same pulse.
  //   · Each star has a tiny per-position phase offset, so timing
  //     isn't mechanical — some light up a moment early, others late.
  RENDERERS.orchestration = function(ctx, t, w, h, opts){
    ctx.clearRect(0,0,w,h);
    const n = 9; // denser lattice — stars closer together
    const mx = w * 0.08;
    const my = h * 0.08;
    const gx = (w - 2*mx)/(n-1);
    const gy = (h - 2*my)/(n-1);
    const mid = (n-1)/2;
    // Offset the clock so the animation is already mid-cycle on mount.
    const tt = t + 1.6;

    // Rotating direction for the directional drift wave.
    const angle = tt * 0.17;
    const cosA = Math.cos(angle);
    const sinA = Math.sin(angle);

    // Cross-fade weight between radial (1) and directional (0),
    // oscillating slowly — gives the animation distinct phases.
    const blend = 0.5 + 0.5 * Math.sin(tt * 0.23);

    const activation = (i, j) => {
      const dx = i - mid, dy = j - mid;
      const dr = Math.hypot(dx, dy);
      const dp = dx * cosA + dy * sinA; // projection onto the drifting axis

      // Per-star phase jitter — deterministic but pseudo-random so the
      // field doesn't pulse in perfect sync.
      const jitter = 0.55 * Math.sin(i * 2.3 + j * 1.7);

      const radial = Math.max(0, Math.sin(tt * 1.25 - dr * 0.72 + jitter));
      const directional = Math.max(0, Math.sin(tt * 0.75 - dp * 0.55 + jitter * 0.6));

      return radial * blend + directional * (1 - blend);
    };

    // Lines — quiet pulse from endpoint activations. Perimeter skipped
    // so no hard rectangular frame can appear at any phase.
    ctx.strokeStyle = opts.line;
    ctx.lineWidth = 1;
    for (let i=0; i<n; i++){
      for (let j=0; j<n; j++){
        const x1 = mx + i*gx;
        const y1 = my + j*gy;
        if (i<n-1 && j!==0 && j!==n-1){
          const endAct = (activation(i, j) + activation(i+1, j)) * 0.5;
          ctx.globalAlpha = 0.05 + endAct * 0.16;
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(mx+(i+1)*gx, y1);
          ctx.stroke();
        }
        if (j<n-1 && i!==0 && i!==n-1){
          const endAct = (activation(i, j) + activation(i, j+1)) * 0.5;
          ctx.globalAlpha = 0.05 + endAct * 0.16;
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x1, my+(j+1)*gy);
          ctx.stroke();
        }
      }
    }
    ctx.globalAlpha = 1;

    // Dots — crisp cores; brightest get a tight additive fleck so
    // they read as stars igniting as each wave passes.
    for (let i=0; i<n; i++){
      for (let j=0; j<n; j++){
        const x = mx + i*gx;
        const y = my + j*gy;
        const a = activation(i, j);
        const lit = a > 0.55;

        ctx.globalCompositeOperation = 'source-over';
        ctx.fillStyle = lit ? opts.accent : opts.line;
        ctx.globalAlpha = 0.28 + a * 0.7;
        ctx.beginPath();
        ctx.arc(x, y, 1.5 + a * 0.9, 0, Math.PI*2);
        ctx.fill();

        if (a > 0.78){
          ctx.globalCompositeOperation = 'lighter';
          ctx.fillStyle = opts.accent;
          ctx.globalAlpha = (a - 0.78) * 0.85;
          ctx.beginPath();
          ctx.arc(x, y, 1.7 + (a - 0.78) * 1.8, 0, Math.PI*2);
          ctx.fill();
        }
      }
    }
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
  };

  // ── Driver ──────────────────────────────────────────────────
  const activeCanvases = new Set();

  function mount(canvas, kind, opts){
    const renderer = RENDERERS[kind];
    if (!renderer) return;
    opts = opts || {};
    const getOpts = () => ({
      accent: opts.accent || getComputedStyle(canvas).getPropertyValue('--cym-accent').trim() || '#BCA1F6',
      line:   opts.line   || getComputedStyle(canvas).getPropertyValue('--cym-line').trim() || 'rgba(255,255,255,0.25)',
    });

    const dpr = window.devicePixelRatio || 1;
    let w = 0, h = 0, ctx = canvas.getContext('2d');

    function resize(){
      const rect = canvas.getBoundingClientRect();
      w = rect.width; h = rect.height;
      canvas.width = w*dpr;
      canvas.height = h*dpr;
      ctx.setTransform(dpr,0,0,dpr,0,0);
    }
    resize();
    window.addEventListener('resize', resize);

    const start = performance.now();
    let rafId = null;
    let running = true;

    function tick(now){
      if (!running) return;
      const t = (now - start)/1000;
      renderer(ctx, t, w, h, getOpts());
      rafId = requestAnimationFrame(tick);
    }
    rafId = requestAnimationFrame(tick);

    const handle = {
      stop(){ running = false; if (rafId) cancelAnimationFrame(rafId); },
      resume(){ if (!running){ running = true; rafId = requestAnimationFrame(tick); } }
    };
    activeCanvases.add(handle);
    return handle;
  }

  window.Cymatics = { mount, RENDERERS };
})();
