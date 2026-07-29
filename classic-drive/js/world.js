// ===================================================================
//  World  --  a bright, friendly park to drive around in.
//  Endless-looking grass (tiles that follow the car), trees, a pond,
//  puffy clouds, jump ramps and spinning "kirakira" stars to collect.
// ===================================================================

const World = (() => {
  'use strict';

  const HALF = 190;        // soft park boundary (car is kept inside)
  const TILE = 10;         // ground tile size
  const VIEW = 8;          // how many tiles out to draw around the car
  const DRAW = 110;        // only draw trees/stars within this range (perf)

  const GRASS_A = '#7ec850';
  const GRASS_B = '#74be48';

  let trees = [], clouds = [], ramps = [], stars = [];
  const pond = { x: 34, z: -28, r: 15 };

  // Road network: an outer loop plus a central cross. Segments are straight
  // centre-lines; they get widened and tiled at draw time. The car starts on
  // the middle intersection.
  const ROAD_W = 9, ROAD_COL = '#7a7f88';
  const RR = 140;
  const roads = [
    { ax: -RR, az: RR, bx: RR, bz: RR },   // north
    { ax: -RR, az: -RR, bx: RR, bz: -RR }, // south
    { ax: -RR, az: -RR, bx: -RR, bz: RR }, // west
    { ax: RR, az: -RR, bx: RR, bz: RR },   // east
    { ax: 0, az: -RR, bx: 0, bz: RR },     // cross (vertical)
    { ax: -RR, az: 0, bx: RR, bz: 0 },     // cross (horizontal)
  ];

  // Is (x,z) on (or near) any road? Used to keep trees off the tarmac.
  function onRoad(x, z, margin = 0) {
    return roads.some((s) => {
      const dx = s.bx - s.ax, dz = s.bz - s.az, len2 = dx * dx + dz * dz;
      let t = ((x - s.ax) * dx + (z - s.az) * dz) / len2;
      t = Math.max(0, Math.min(1, t));
      const cx = s.ax + dx * t, cz = s.az + dz * t;
      return Math.hypot(x - cx, z - cz) < ROAD_W / 2 + margin;
    });
  }

  function rnd(a, b) { return a + Math.random() * (b - a); }

  // n-sided pyramid (used for tree tops).
  function pyramid(cx, y0, cz, r, h, color, n = 6) {
    const faces = [], base = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      base.push([cx + Math.cos(a) * r, y0, cz + Math.sin(a) * r]);
    }
    const apex = [cx, y0 + h, cz];
    for (let i = 0; i < n; i++) {
      faces.push({ v: [base[i], base[(i + 1) % n], apex], color });
    }
    return faces;
  }

  function init() {
    ramps = [
      { x: 0, z: 40, w: 6, len: 8, h: 2.4, yaw: 0 },
      { x: -30, z: 10, w: 6, len: 8, h: 2.2, yaw: Math.PI / 2 },
      { x: 40, z: 30, w: 6, len: 8, h: 2.6, yaw: 0 },
      { x: -70, z: -60, w: 6, len: 8, h: 2.8, yaw: 0 },
      { x: 90, z: -40, w: 6, len: 9, h: 3.0, yaw: Math.PI / 2 },
      { x: -50, z: 100, w: 6, len: 8, h: 2.6, yaw: 0 },
    ];

    const clearOfRamps = (x, z) => ramps.every((r) => Math.hypot(x - r.x, z - r.z) > 12);

    trees = [];
    for (let i = 0; i < 150; i++) {
      let x, z, ok = false, tries = 0;
      while (!ok && tries++ < 20) {
        // bias trees toward the edges so the middle stays open to play
        const edge = Math.random() < 0.55;
        x = edge ? rnd(-HALF, HALF) : rnd(-HALF * 0.7, HALF * 0.7);
        z = edge ? rnd(-HALF, HALF) : rnd(-HALF * 0.7, HALF * 0.7);
        const dCenter = Math.hypot(x, z);
        const dPond = Math.hypot(x - pond.x, z - pond.z);
        ok = dCenter > 14 && dPond > pond.r + 3 && clearOfRamps(x, z) && !onRoad(x, z, 2.5);
      }
      trees.push({ x, z, s: rnd(0.8, 1.5), c: Math.random() < 0.5 ? '#3f9d3a' : '#358a34' });
    }

    clouds = [];
    for (let i = 0; i < 16; i++) {
      clouds.push({ x: rnd(-HALF, HALF), y: rnd(24, 36), z: rnd(-HALF, HALF), r: rnd(6, 11) });
    }

    stars = [];
    for (let i = 0; i < 150; i++) spawnStar(stars[i] = {});
  }

  function spawnStar(st) {
    let x, z, ok = false, tries = 0;
    while (!ok && tries++ < 30) {
      x = rnd(-HALF * 0.92, HALF * 0.92);
      z = rnd(-HALF * 0.92, HALF * 0.92);
      ok = Math.hypot(x - pond.x, z - pond.z) > pond.r + 2;
    }
    st.x = x; st.z = z;
    st.taken = false;
    st.phase = Math.random() * Math.PI * 2;
    st.color = STAR_COLORS[(Math.random() * STAR_COLORS.length) | 0];
  }

  // Octahedron "star" gems, in lots of happy colours.
  const STAR_COLORS = ['#ffd83b', '#ff5d73', '#4ec3ff', '#8cff5b', '#c77dff', '#ff9f43', '#ff7ac0'];
  function makeStar(color) {
    const s = 0.55, y = 1.4;
    const V = [[0, y + s, 0], [0, y - s, 0], [s, y, 0], [-s, y, 0], [0, y, s], [0, y, -s]];
    const F = [[0, 2, 4], [0, 4, 3], [0, 3, 5], [0, 5, 2], [1, 4, 2], [1, 3, 4], [1, 5, 3], [1, 2, 5]];
    return F.map((f) => ({ v: f.map((i) => V[i]), color }));
  }
  const STAR_MODELS = {};
  STAR_COLORS.forEach((c) => { STAR_MODELS[c] = makeStar(c); });

  function render(carX, carZ, carYaw, t) {
    // ground tiles centred on the car (looks endless)
    const bi = Math.round(carX / TILE), bj = Math.round(carZ / TILE);
    const sy = Math.sin(Engine.cam.yaw), cyaw = Math.cos(Engine.cam.yaw);
    for (let di = -VIEW; di <= VIEW; di++) {
      for (let dj = -VIEW; dj <= VIEW; dj++) {
        const cx = (bi + di) * TILE, cz = (bj + dj) * TILE;
        // cheap behind-camera cull
        const rx = cx - Engine.cam.x, rz = cz - Engine.cam.z;
        const vz = rx * sy + rz * cyaw;
        if (vz < -TILE) continue;
        const col = (((bi + di) + (bj + dj)) & 1) ? GRASS_A : GRASS_B;
        const h = TILE / 2;
        Engine.add([[cx - h, 0, cz - h], [cx + h, 0, cz - h],
                    [cx + h, 0, cz + h], [cx - h, 0, cz + h]], col, false, 0);
      }
    }

    // roads: widen each centre-line and tile it into short pieces so the
    // near-plane cull works and long roads don't pop. White dashes down the
    // middle. Drawn on a sub-layer above the grass, below the car.
    const hw = ROAD_W / 2;
    for (const s of roads) {
      const dx = s.bx - s.ax, dz = s.bz - s.az, len = Math.hypot(dx, dz);
      const ux = dx / len, uz = dz / len, px = -uz, pz = ux;
      for (let d = 0; d < len; d += TILE) {
        const d2 = Math.min(len, d + TILE);
        const mx = s.ax + ux * (d + d2) / 2, mz = s.az + uz * (d + d2) / 2;
        if (Math.abs(mx - carX) > DRAW || Math.abs(mz - carZ) > DRAW) continue;
        const a0x = s.ax + ux * d, a0z = s.az + uz * d;
        const a1x = s.ax + ux * d2, a1z = s.az + uz * d2;
        Engine.add([[a0x + px * hw, 0.02, a0z + pz * hw], [a1x + px * hw, 0.02, a1z + pz * hw],
                    [a1x - px * hw, 0.02, a1z - pz * hw], [a0x - px * hw, 0.02, a0z - pz * hw]],
          ROAD_COL, false, 0.3);
        // centre dash (short, with a gap before the next piece)
        const dl = 2.2, dw = 0.32;
        Engine.add([[mx - ux * dl + px * dw, 0.03, mz - uz * dl + pz * dw],
                    [mx + ux * dl + px * dw, 0.03, mz + uz * dl + pz * dw],
                    [mx + ux * dl - px * dw, 0.03, mz + uz * dl - pz * dw],
                    [mx - ux * dl - px * dw, 0.03, mz - uz * dl - pz * dw]],
          '#f4f4f4', false, 0.36);
      }
    }

    // pond (flat blue disc) sits just above the grass, still ground layer
    const pn = 14, pv = [];
    for (let i = 0; i < pn; i++) {
      const a = (i / pn) * Math.PI * 2;
      pv.push([pond.x + Math.cos(a) * pond.r, 0.02, pond.z + Math.sin(a) * pond.r]);
    }
    Engine.add(pv, '#49b6e8', false, 0.5);

    // ramps
    for (const r of ramps) {
      const hw = r.w / 2, hl = r.len / 2;
      // wedge: rises from back(-hl) up to front(+hl)
      const p = (x, y, z) => {
        const c = Math.cos(r.yaw), s = Math.sin(r.yaw);
        return [r.x + x * c + z * s, y, r.z - x * s + z * c];
      };
      const col = '#c98b4a';
      Engine.add([p(-hw, 0, -hl), p(hw, 0, -hl), p(hw, r.h, hl), p(-hw, r.h, hl)], col); // top
      Engine.add([p(-hw, 0, -hl), p(hw, 0, -hl), p(hw, 0, hl), p(-hw, 0, hl)], '#a06f38', false); // bottom
      Engine.add([p(-hw, 0, hl), p(hw, 0, hl), p(hw, r.h, hl), p(-hw, r.h, hl)], '#b57e42'); // front face
      Engine.add([p(-hw, 0, -hl), p(-hw, 0, hl), p(-hw, r.h, hl)], col); // side L
      Engine.add([p(hw, 0, -hl), p(hw, 0, hl), p(hw, r.h, hl)], col);   // side R
    }

    // trees (only nearby ones, keeps the big park cheap to draw)
    for (const tr of trees) {
      if (Math.abs(tr.x - carX) > DRAW || Math.abs(tr.z - carZ) > DRAW) continue;
      Engine.addModel(Cars.box([-0.18 * tr.s, 0, -0.18 * tr.s],
                              [0.18 * tr.s, 1.1 * tr.s, 0.18 * tr.s], '#7a4a22'),
        tr.x, 0, tr.z, 0);
      Engine.addModel(pyramid(0, 1.0 * tr.s, 0, 1.1 * tr.s, 1.6 * tr.s, tr.c),
        tr.x, 0, tr.z, 0);
      Engine.addModel(pyramid(0, 1.9 * tr.s, 0, 0.8 * tr.s, 1.3 * tr.s, tr.c),
        tr.x, 0, tr.z, 0);
    }

    // clouds (puffy: three overlapping hexagons)
    for (const c of clouds) {
      for (const o of [[-c.r * 0.6, 0], [c.r * 0.6, 0], [0, 0]]) {
        const cv = [];
        for (let i = 0; i < 7; i++) {
          const a = (i / 7) * Math.PI * 2;
          cv.push([c.x + o[0] + Math.cos(a) * c.r, c.y + Math.sin(a) * c.r * 0.6, c.z]);
        }
        Engine.add(cv, '#ffffff', false);
      }
    }

    // stars (spin + gentle bob), each in its own colour; cull the far ones
    for (const st of stars) {
      if (st.taken) continue;
      if (Math.abs(st.x - carX) > DRAW || Math.abs(st.z - carZ) > DRAW) continue;
      const bob = Math.sin(t * 2.5 + st.phase) * 0.25;
      Engine.addModel(STAR_MODELS[st.color] || STAR_MODELS[STAR_COLORS[0]],
        st.x, bob, st.z, t * 2 + st.phase);
    }
  }

  return { init, render, spawnStar, get stars() { return stars; },
           get ramps() { return ramps; }, HALF, pond };
})();
