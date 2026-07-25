// ===================================================================
//  Game  --  title/car-select, driving, camera, audio, HUD.
//  Free-roam joyride for a 5-year-old: the car drives forward on its
//  own, the child only steers left / right. Nothing to lose.
// ===================================================================

(() => {
  'use strict';

  const canvas = document.getElementById('c');
  const ctx = canvas.getContext('2d');
  let W = 0, H = 0, DPR = Math.min(2, window.devicePixelRatio || 1);

  function resize() {
    W = window.innerWidth; H = window.innerHeight;
    canvas.width = W * DPR; canvas.height = H * DPR;
    canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }
  window.addEventListener('resize', resize);
  resize();

  // ---- state -------------------------------------------------------
  let mode = 'title';          // 'title' | 'play'
  let carId = 'mini';
  let carModel = Cars.build(carId);
  let score = 0;

  const car = { x: 0, z: 0, y: 0, vy: 0, yaw: 0, speed: 0, air: false };
  const CRUISE = 15, TURBO = 28, TURN = 1.9, GRAV = 24;
  const input = { left: false, right: false, turbo: false };

  // ---- audio -------------------------------------------------------
  let actx = null, master = null, engineOsc = null, engineGain = null, muted = false;
  function initAudio() {
    if (actx) return;
    try {
      actx = new (window.AudioContext || window.webkitAudioContext)();
      master = actx.createGain(); master.gain.value = muted ? 0 : 0.5; master.connect(actx.destination);
      engineGain = actx.createGain(); engineGain.gain.value = 0.0; engineGain.connect(master);
      engineOsc = actx.createOscillator(); engineOsc.type = 'sawtooth';
      engineOsc.frequency.value = 60; engineOsc.connect(engineGain); engineOsc.start();
    } catch (e) { actx = null; }
  }
  function beep(freq, dur, type = 'sine', vol = 0.4, at = 0) {
    if (!actx) return;
    const o = actx.createOscillator(), g = actx.createGain();
    o.type = type; o.frequency.value = freq; o.connect(g); g.connect(master);
    const t0 = actx.currentTime + at;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol, t0 + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.start(t0); o.stop(t0 + dur + 0.02);
  }
  function chime() { beep(880, 0.12, 'sine', 0.5); beep(1320, 0.16, 'sine', 0.5, 0.08); }
  function honk() { beep(180, 0.18, 'square', 0.5); beep(150, 0.22, 'square', 0.5, 0.16); }
  // rising "whee" when launching off a ramp
  function jumpSfx() {
    if (!actx) return;
    const o = actx.createOscillator(), g = actx.createGain();
    o.type = 'sine'; o.connect(g); g.connect(master);
    const t0 = actx.currentTime;
    o.frequency.setValueAtTime(440, t0);
    o.frequency.exponentialRampToValueAtTime(1100, t0 + 0.28);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(0.4, t0 + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.32);
    o.start(t0); o.stop(t0 + 0.34);
  }
  function landSfx() { beep(120, 0.12, 'triangle', 0.4); }

  // ---- input -------------------------------------------------------
  function bindHold(id, on, off) {
    const el = document.getElementById(id);
    const down = (e) => { e.preventDefault(); initAudio(); on(); };
    const up = (e) => { e.preventDefault(); off(); };
    el.addEventListener('pointerdown', down);
    el.addEventListener('pointerup', up);
    el.addEventListener('pointerleave', up);
    el.addEventListener('pointercancel', up);
  }
  bindHold('btn-left', () => input.left = true, () => input.left = false);
  bindHold('btn-right', () => input.right = true, () => input.right = false);
  bindHold('btn-turbo', () => input.turbo = true, () => input.turbo = false);
  document.getElementById('btn-horn').addEventListener('pointerdown', (e) => { e.preventDefault(); initAudio(); honk(); });

  window.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft' || e.key === 'a') input.left = true;
    else if (e.key === 'ArrowRight' || e.key === 'd') input.right = true;
    else if (e.key === 'ArrowUp' || e.key === 'Shift' || e.key === 'w') { initAudio(); input.turbo = true; }
    else if (e.key === ' ') { initAudio(); honk(); }
  });
  window.addEventListener('keyup', (e) => {
    if (e.key === 'ArrowLeft' || e.key === 'a') input.left = false;
    else if (e.key === 'ArrowRight' || e.key === 'd') input.right = false;
    else if (e.key === 'ArrowUp' || e.key === 'Shift' || e.key === 'w') input.turbo = false;
  });

  document.getElementById('btn-mute').addEventListener('click', () => {
    muted = !muted;
    if (master) master.gain.value = muted ? 0 : 0.5;
    document.getElementById('btn-mute').textContent = muted ? '🔇' : '🔊';
  });

  // ---- title / car select -----------------------------------------
  const cardsEl = document.getElementById('cards');
  const previews = [];
  Cars.list.forEach((c) => {
    const card = document.createElement('div');
    card.className = 'card' + (c.id === carId ? ' sel' : '');
    card.dataset.id = c.id;
    const cv = document.createElement('canvas');
    cv.width = 200; cv.height = 150; cv.className = 'prev';
    const label = document.createElement('div');
    label.className = 'name'; label.textContent = c.jp;
    card.appendChild(cv); card.appendChild(label);
    card.addEventListener('click', () => {
      carId = c.id; carModel = Cars.build(carId);
      document.querySelectorAll('.card').forEach((k) => k.classList.toggle('sel', k.dataset.id === carId));
    });
    cardsEl.appendChild(card);
    previews.push({ id: c.id, ctx: cv.getContext('2d'), model: c.build() });
  });

  document.getElementById('btn-start').addEventListener('click', () => {
    initAudio();
    mode = 'play';
    score = 0;
    car.x = 0; car.z = 0; car.y = 0; car.vy = 0; car.yaw = 0; car.speed = 0; car.air = false;
    input.left = input.right = input.turbo = false;
    document.getElementById('title').classList.add('hidden');
    document.getElementById('hud').classList.remove('hidden');
    document.getElementById('controls').classList.remove('hidden');
    updateScore();
  });

  function updateScore() { document.getElementById('score').textContent = '⭐ ' + score; }

  // ---- physics helpers --------------------------------------------
  function rampHeightAt(x, z) {
    let h = 0;
    // World keeps ramps private; recompute from its exported list would be
    // ideal, but we sample via a small public helper instead.
    for (const r of World.ramps) {
      const c = Math.cos(-r.yaw), s = Math.sin(-r.yaw);
      const lx = (x - r.x) * c + (z - r.z) * s;
      const lz = -(x - r.x) * s + (z - r.z) * c;
      if (Math.abs(lx) < r.w / 2 && Math.abs(lz) < r.len / 2) {
        const hh = r.h * (lz + r.len / 2) / r.len; // rises back -> front
        if (hh > h) h = hh;
      }
    }
    return h;
  }

  // ---- update ------------------------------------------------------
  function update(dt, now) {
    // steering (only while there is some speed, like a real car)
    const steer = (input.right ? 1 : 0) - (input.left ? 1 : 0);
    car.yaw += steer * TURN * dt * Math.min(1, car.speed / 6 + 0.2);

    // auto-forward, easing to cruise (or TURBO while boosting); slow in pond.
    // Steering in the air keeps some control but can't change ground speed.
    const inPond = Math.hypot(car.x - World.pond.x, car.z - World.pond.z) < World.pond.r;
    const boosting = input.turbo && !inPond && !car.air;
    const target = inPond ? CRUISE * 0.4 : (input.turbo ? TURBO : CRUISE);
    car.speed += (target - car.speed) * Math.min(1, dt * (boosting ? 3 : 2));

    const fx = Math.sin(car.yaw), fz = Math.cos(car.yaw);
    car.x += fx * car.speed * dt;
    car.z += fz * car.speed * dt;

    // vertical: ride up ramps and leap off the top. Faster = bigger jump,
    // so charging a ramp with turbo sends the car flying.
    const ground = rampHeightAt(car.x, car.z);
    const prevGround = car._pg || 0;
    if (car.air) {
      // in flight: simple projectile motion until we touch down
      car.vy -= GRAV * dt;
      car.y += car.vy * dt;
      if (car.y <= ground) { car.y = ground; car.vy = 0; car.air = false; landSfx(); }
    } else if (prevGround > 0.5 && ground < prevGround - 0.05) {
      // just ran off the top of a ramp -> launch upward from the peak
      car.y = prevGround;
      car.vy = Math.max(9, car.speed * 0.72);
      car.air = true; jumpSfx();
    } else {
      // glued to the ground / ramp surface
      car.y = ground; car.vy = 0;
    }
    car._pg = ground;

    // soft park boundary: steer/nudge back inside
    const B = World.HALF - 3;
    if (car.x > B) { car.x = B; car.yaw += 0.03; }
    else if (car.x < -B) { car.x = -B; car.yaw += 0.03; }
    if (car.z > B) { car.z = B; car.yaw += 0.03; }
    else if (car.z < -B) { car.z = -B; car.yaw += 0.03; }

    // engine sound tracks speed
    if (engineOsc) {
      engineGain.gain.value = muted ? 0 : 0.06;
      engineOsc.frequency.value = 55 + car.speed * 6 + (car.vy > 1 ? 40 : 0);
    }

    // collect stars
    for (const st of World.stars) {
      if (st.taken) {
        if (now >= st.retime) World.spawnStar(st);
        continue;
      }
      if (Math.hypot(car.x - st.x, car.z - st.z) < 2.5) {
        st.taken = true; st.retime = now + 4;
        score++; updateScore(); chime();
      }
    }

    // chase camera (smoothed)
    const cam = Engine.cam;
    const camDist = 9, camHt = 4.6;
    // follow the car's height only partly, so leaping off a ramp reads as a
    // big, satisfying jump instead of the camera rising with the car.
    const tx = car.x - fx * camDist, tz = car.z - fz * camDist, ty = car.y * 0.4 + camHt;
    cam.x += (tx - cam.x) * Math.min(1, dt * 6);
    cam.z += (tz - cam.z) * Math.min(1, dt * 6);
    cam.y += (ty - cam.y) * Math.min(1, dt * 6);
    // smooth yaw toward car heading (shortest way)
    let dy = car.yaw - cam.yaw;
    while (dy > Math.PI) dy -= 2 * Math.PI;
    while (dy < -Math.PI) dy += 2 * Math.PI;
    cam.yaw += dy * Math.min(1, dt * 5);
    cam.pitch = 0.30;
    // widen the view a touch while boosting for a rush-of-speed feel
    const targetFov = input.turbo ? 1.2 : 1.05;
    cam.fov += (targetFov - cam.fov) * Math.min(1, dt * 4);
  }

  // ---- render ------------------------------------------------------
  function drawSky() {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#8fd3ff');
    g.addColorStop(1, '#d9f2ff');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    // grass backdrop below the horizon so no sky shows through gaps
    const focal = (H / 2) / Math.tan(Engine.cam.fov / 2);
    let hz = H / 2 - focal * Math.tan(Engine.cam.pitch);
    hz = Math.max(0, Math.min(H, hz));
    const gg = ctx.createLinearGradient(0, hz, 0, H);
    gg.addColorStop(0, '#79c24b');
    gg.addColorStop(1, '#7ec850');
    ctx.fillStyle = gg; ctx.fillRect(0, hz, W, H - hz);
  }

  function renderPlay(now, t) {
    drawSky();
    Engine.reset();
    World.render(car.x, car.z, car.yaw, t);
    Engine.addModel(carModel, car.x, car.y, car.z, car.yaw);
    Engine.render(ctx, W, H);
  }

  function renderPreviews(t) {
    const cam = Engine.cam;
    const save = { x: cam.x, y: cam.y, z: cam.z, yaw: cam.yaw, pitch: cam.pitch, fov: cam.fov };
    for (const p of previews) {
      const c = p.ctx, w = 200, h = 150;
      const g = c.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, '#bfe8ff'); g.addColorStop(1, '#eaf7ff');
      c.fillStyle = g; c.fillRect(0, 0, w, h);
      cam.x = 0; cam.y = 1.9; cam.z = 5.2; cam.yaw = Math.PI; cam.pitch = 0.16; cam.fov = 0.9;
      Engine.reset();
      Engine.addModel(p.model, 0, 0, 0, t * 0.8);
      Engine.render(c, w, h);
    }
    Object.assign(cam, save);
  }

  // ---- main loop ---------------------------------------------------
  World.init();
  let last = performance.now();
  function frame(ts) {
    const now = ts / 1000;
    let dt = (ts - last) / 1000; last = ts;
    if (dt > 0.05) dt = 0.05; // clamp big gaps

    if (mode === 'play') {
      update(dt, now);
      renderPlay(now, now);
    } else {
      renderPreviews(now);
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
