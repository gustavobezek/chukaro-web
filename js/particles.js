/* ============================================================
   CHUKARO — Capa de ambiente
   Partículas flotantes (puntos + marcas de tracking tipo "tracking markers"
   de VFX), reacción al scroll (impulso + parallax por capas),
   paralaje de mouse y lens flare anamórfico.
   ============================================================ */
(function () {
  'use strict';

  var canvas = document.getElementById('fx');
  if (!canvas) return;
  var ctx = canvas.getContext('2d');

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var W = 0, H = 0, DPR = 1;
  var particles = [];
  var mouse = { x: 0.5, y: 0.5, tx: 0.5, ty: 0.5 };
  var scroll = { y: 0, vel: 0, last: 0 };
  var flare = { x: 0.78, y: 0.16, pulse: 0 };
  var raf = null;
  var running = true;

  function resize() {
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = Math.floor(W * DPR);
    canvas.height = Math.floor(H * DPR);
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    build();
  }

  function rnd(a, b) { return a + Math.random() * (b - a); }

  // Cada partícula pertenece a una capa de profundidad (0 lejos → 1 cerca)
  function build() {
    var count = Math.round(Math.min(150, Math.max(60, (W * H) / 16000)));
    particles = [];
    for (var i = 0; i < count; i++) {
      var depth = rnd(0.15, 1);
      var type = Math.random();
      particles.push({
        x: rnd(0, W),
        y: rnd(0, H),
        z: depth,
        r: rnd(0.6, 1.9) * depth + 0.35,
        vx: rnd(-0.12, 0.12) * depth,
        vy: rnd(-0.16, -0.02) * depth,
        // tipo: 0 punto, 1 cruz de tracking, 2 cuadro de encuadre, 3 destello
        kind: type < 0.74 ? 0 : (type < 0.88 ? 1 : (type < 0.97 ? 2 : 3)),
        a: rnd(0.12, 0.6) * depth,
        tw: rnd(0.0008, 0.0035),
        ph: rnd(0, Math.PI * 2)
      });
    }
  }

  function onScroll() {
    var y = window.scrollY || window.pageYOffset || 0;
    scroll.vel = y - scroll.last;
    scroll.last = y;
    scroll.y = y;
  }

  function draw(t) {
    ctx.clearRect(0, 0, W, H);

    // ---- LENS FLARE (anamórfico) ----
    var docH = Math.max(1, document.body.scrollHeight - H);
    var prog = Math.min(1, Math.max(0, scroll.y / docH));
    flare.pulse += (Math.abs(scroll.vel) * 0.012 - flare.pulse) * 0.08;
    var fx = (0.82 - prog * 0.5 + (mouse.tx - 0.5) * 0.06) * W;
    var fy = (0.14 + prog * 0.42 + (mouse.ty - 0.5) * 0.05) * H;
    var glow = 0.5 + Math.min(0.5, flare.pulse);

    var g = ctx.createRadialGradient(fx, fy, 0, fx, fy, 220 + flare.pulse * 260);
    g.addColorStop(0, 'rgba(255,255,255,' + (0.10 * glow).toFixed(4) + ')');
    g.addColorStop(0.35, 'rgba(255,255,255,' + (0.035 * glow).toFixed(4) + ')');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(fx - 480, fy - 480, 960, 960);

    // streak horizontal (anamórfico)
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    var sw = 200 + flare.pulse * 900;
    var sg = ctx.createLinearGradient(fx - sw, fy, fx + sw, fy);
    sg.addColorStop(0, 'rgba(255,255,255,0)');
    sg.addColorStop(0.5, 'rgba(255,255,255,' + (0.085 * glow).toFixed(4) + ')');
    sg.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = sg;
    ctx.fillRect(fx - sw, fy - 1.1, sw * 2, 2.2);
    ctx.restore();

    // ---- PARTÍCULAS ----
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    var parX = (mouse.x - 0.5) * 46;
    var parY = (mouse.y - 0.5) * 30;
    var docProg = prog;

    for (var i = 0; i < particles.length; i++) {
      var p = particles[i];

      if (!reduced) {
        p.x += p.vx;
        p.y += p.vy + scroll.vel * 0.055 * p.z; // el scroll las empuja como scrub
        p.ph += p.tw * 16;
      }

      // wrap
      if (p.x < -30) p.x = W + 30; else if (p.x > W + 30) p.x = -30;
      if (p.y < -30) p.y = H + 30; else if (p.y > H + 30) p.y = -30;

      // paralaje: capas cercanas se mueven más con el scroll y el mouse
      var px = p.x + parX * p.z;
      var py = p.y + parY * p.z - docProg * 120 * p.z;

      // envoltura vertical del viewport tras paralaje
      py = ((py % (H + 60)) + (H + 60)) % (H + 60) - 30;

      var tw = 0.65 + 0.35 * Math.sin(p.ph * 60);
      var alpha = p.a * tw;

      ctx.fillStyle = 'rgba(255,255,255,' + alpha.toFixed(4) + ')';
      ctx.strokeStyle = 'rgba(255,255,255,' + alpha.toFixed(4) + ')';
      ctx.lineWidth = 1;

      if (p.kind === 0) {
        ctx.beginPath();
        ctx.arc(px, py, p.r, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.kind === 1) {
        // marca de tracking (cruz)
        var s = 2.6 + p.r * 2;
        ctx.beginPath();
        ctx.moveTo(px - s, py); ctx.lineTo(px + s, py);
        ctx.moveTo(px, py - s); ctx.lineTo(px, py + s);
        ctx.stroke();
      } else if (p.kind === 2) {
        // corchete de encuadre
        var b = 3.4 + p.r * 2.4;
        ctx.strokeRect(px - b / 2, py - b / 2, b, b);
      } else {
        // destello tenue
        ctx.globalAlpha = alpha * 0.7;
        ctx.beginPath();
        ctx.arc(px, py, p.r * 2.6, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }
    }
    ctx.restore();
  }

  function loop(t) {
    if (!running) return;
    // easing del mouse
    mouse.x += (mouse.tx - mouse.x) * 0.06;
    mouse.y += (mouse.ty - mouse.y) * 0.06;
    // decaimiento del impulso del scroll
    scroll.vel *= 0.9;
    draw(t);
    raf = requestAnimationFrame(loop);
  }

  // ---- eventos ----
  window.addEventListener('resize', resize, { passive: true });
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('mousemove', function (e) {
    mouse.tx = e.clientX / Math.max(1, window.innerWidth);
    mouse.ty = e.clientY / Math.max(1, window.innerHeight);
  }, { passive: true });

  document.addEventListener('visibilitychange', function () {
    if (document.hidden) {
      running = false;
      if (raf) cancelAnimationFrame(raf);
    } else if (!running) {
      running = true;
      raf = requestAnimationFrame(loop);
    }
  });

  resize();
  onScroll();
  raf = requestAnimationFrame(loop);

  // API pública por si main.js quiere pular el flare (corte de navegación)
  window.ChukaroFX = {
    flash: function () { flare.pulse = Math.min(2.2, flare.pulse + 1.6); },
    setMouse: function (x, y) { mouse.tx = x; mouse.ty = y; }
  };
})();
