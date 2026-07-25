// ===================================================================
//  World  --  a bright, friendly park to drive around in.
//  Endless-looking grass (tiles that follow the car), trees, a pond,
//  puffy clouds, jump ramps and spinning "kirakira" stars to collect.
// ===================================================================

const World = (() => {
  'use strict';

  const HALF = 100;        // soft park boundary (car is kept inside)
  const TILE = 10;         // ground tile size
  const VIEW = 8;          // how many tiles out to draw around the car

  const GRASS_A = '#7ec850';
  const GRASS_B = '#74be48';

  let trees = [], clouds = [], ramps = [], stars = [];
  const pond = { x: 34, z: -28, r: 15 };

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
    trees = [];
    for (let i = 0; i < 46; i++) {
      let x, z, ok = false, tries = 0;
      while (!ok && tries++ < 20) {
        // bias trees toward the edges so the middle stays open to play
        const edge = Math.random() < 0.55;
        x = edge ? rnd(-HALF, HALF) : rnd(-HALF * 0.7, HALF * 0.7);
        z = edge ? rnd(-HALF, HALF) : rnd(-HALF * 0.7, HALF * 0.7);
        const dCenter = Math.hypot(x, z);
        const dPond = Math.hypot(x - pond.x, z - pond.z);
        ok = dCenter > 14 && dPond > pond.r + 3;
      }
      trees.push({ x, z, s: rnd(0.8, 1.5), c: Math.random() < 0.5 ? '#3f9d3a' : '#358a34' });
    }

    clouds = [];
    for (let i = 0; i < 10; i++) {
      clouds.push({ x: rnd(-HALF, HALF), y: rnd(24, 34), z: rnd(-HALF, HALF), r: rnd(6, 11) });
    }

    ramps = [
      { x: 0, z: 40, w: 6, len: 8, h: 2.4, yaw: 0 },
      { x: -30, z: 10, w: 6, len: 8, h: 2.2, yaw: Math.PI / 2 },
      { x: 40, z: 30, w: 6, len: 8, h: 2.6, yaw: 0 },
    ];

    stars = [];
    for (let i = 0; i < 16; i++) spawnStar(stars[i] = {});
  }

  function spawnStar(st) {
    let x, z, ok = false, tries = 0;
    while (!ok && tries++ < 30) {
      x = rnd(-HALF * 0.9, HALF * 0.9);
      z = rnd(-HALF * 0.9, HALF * 0.9);
      ok = Math.hypot(x - pond.x, z - pond.z) > pond.r + 2;
    }
    st.x = x; st.z = z;
    st.taken = false;
    st.phase = Math.random() * Math.PI * 2;
  }

  // Octahedron "star" gem.
  const STAR = (() => {
    const s = 0.55, y = 1.4;
    const V = [[0, y + s, 0], [0, y - s, 0], [s, y, 0], [-s, y, 0], [0, y, s], [0, y, -s]];
    const F = [[0, 2, 4], [0, 4, 3], [0, 3, 5], [0, 5, 2], [1, 4, 2], [1, 3, 4], [1, 5, 3], [1, 2, 5]];
    return F.map((f) => ({ v: f.map((i) => V[i]), color: '#ffd83b' }));
  })();

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
                    [cx + h, 0, cz + h], [cx - h, 0, cz + h]], col, false);
      }
    }

    // pond (flat blue disc)
    const pn = 14, pv = [];
    for (let i = 0; i < pn; i++) {
      const a = (i / pn) * Math.PI * 2;
      pv.push([pond.x + Math.cos(a) * pond.r, 0.02, pond.z + Math.sin(a) * pond.r]);
    }
    Engine.add(pv, '#49b6e8', false);

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

    // trees
    for (const tr of trees) {
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

    // stars (spin + gentle bob)
    for (const st of stars) {
      if (st.taken) continue;
      const bob = Math.sin(t * 2.5 + st.phase) * 0.25;
      Engine.addModel(STAR, st.x, bob, st.z, t * 2 + st.phase);
    }
  }

  return { init, render, spawnStar, get stars() { return stars; },
           get ramps() { return ramps; }, HALF, pond };
})();
