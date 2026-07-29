// ===================================================================
//  Cars  --  four classic cars built from simple polygons.
//  Each build() returns an array of faces: { v:[[x,y,z]...], color, shade }
//  Local axes:  x = left(-)/right(+),  y = up (0 = ground),  z = forward(+)
//  A 5-year-old recognises them by shape proportions + colour + name.
// ===================================================================

const Cars = (() => {
  'use strict';

  // Axis-aligned box between corners a and b -> 6 quad faces.
  function box(a, b, color, shade = true) {
    const [x0, y0, z0] = a, [x1, y1, z1] = b;
    return [
      { v: [[x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1]], color, shade }, // bottom
      { v: [[x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1]], color, shade }, // top
      { v: [[x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]], color, shade }, // front
      { v: [[x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0]], color, shade }, // back
      { v: [[x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0]], color, shade }, // left
      { v: [[x1, y0, z0], [x1, y0, z1], [x1, y1, z1], [x1, y1, z0]], color, shade }, // right
    ];
  }

  // Wheel: 8-sided prism whose axle runs along X (so it "rolls" forward).
  function wheel(cx, cy, cz, r, w, color = '#222831') {
    const faces = [], n = 8, hw = w / 2;
    const ring = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      ring.push([cy + Math.cos(a) * r, cz + Math.sin(a) * r]);
    }
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      const [ay, az] = ring[i], [by, bz] = ring[j];
      faces.push({ v: [[cx - hw, ay, az], [cx + hw, ay, az], [cx + hw, by, bz], [cx - hw, by, bz]], color });
    }
    // outer cap (slightly lighter -> looks like a hubcap)
    const cap = '#3a4150';
    faces.push({ v: ring.map(([y, z]) => [cx + hw, y, z]), color: cap });
    faces.push({ v: ring.map(([y, z]) => [cx - hw, y, z]), color: cap });
    return faces;
  }

  function wheels(halfWidth, r, zFront, zBack) {
    const w = 0.28;
    return [
      ...wheel(-halfWidth, r, zFront, r, w),
      ...wheel(halfWidth, r, zFront, r, w),
      ...wheel(-halfWidth, r, zBack, r, w),
      ...wheel(halfWidth, r, zBack, r, w),
    ];
  }

  // Two round headlights at the front (z = zf).
  function lights(zf, y, x) {
    const s = 0.14;
    const L = '#fff6c8';
    return [
      ...box([-x - s, y - s, zf], [-x + s, y + s, zf + 0.05], L, false),
      ...box([x - s, y - s, zf], [x + s, y + s, zf + 0.05], L, false),
    ];
  }

  // A flat windscreen/roof glass helper (dark glass).
  const GLASS = '#2b3a55';

  // ---- Classic Mini : small, tall, boxy, big glasshouse ------------
  function mini(body = '#0b6e3b', roof = '#f4f4f4') {
    const hw = 0.72, r = 0.42;
    const f = [];
    f.push(...box([-hw, r * 0.5, -1.5], [hw, 1.05, 1.5], body));        // lower body
    f.push(...box([-hw * 0.9, 1.05, -1.15], [hw * 0.9, 1.6, 1.0], GLASS, false)); // glasshouse
    f.push(...box([-hw * 0.95, 1.55, -1.05], [hw * 0.95, 1.72, 0.95], roof)); // flat roof
    f.push(...lights(1.5, 0.85, 0.5));
    f.push(...box([-hw, 0.55, 1.48], [hw, 0.78, 1.55], '#d9d9d9', false)); // chrome bumper
    f.push(...wheels(hw, r, 1.0, -1.0));
    return f;
  }

  // ---- VW Beetle : rounded, domed roof, hump front & back ----------
  function beetle(body = '#5bb7e6') {
    const hw = 0.78, r = 0.44;
    const f = [];
    // rounded lower body approximated with a chamfered box
    f.push(...box([-hw, r * 0.5, -1.55], [hw, 0.95, 1.55], body));
    // front hood slope (trapezoid down to nose)
    f.push({ v: [[-hw, 0.95, 0.4], [hw, 0.95, 0.4], [hw * 0.7, 0.7, 1.6], [-hw * 0.7, 0.7, 1.6]], color: body });
    // rear engine hump slope
    f.push({ v: [[-hw, 0.95, -0.4], [hw, 0.95, -0.4], [hw * 0.7, 0.7, -1.6], [-hw * 0.7, 0.7, -1.6]], color: body });
    // domed cabin (narrower box) + rounded top piece
    f.push(...box([-hw * 0.78, 0.95, -0.55], [hw * 0.78, 1.45, 0.55], GLASS, false));
    f.push(...box([-hw * 0.6, 1.42, -0.45], [hw * 0.6, 1.62, 0.45], body)); // dome roof
    f.push(...lights(1.5, 0.9, 0.55)); // round bug-eyes
    f.push(...box([-hw * 0.35, 0.75, 1.5], [hw * 0.35, 1.0, 1.62], body)); // little nose
    f.push(...wheels(hw, r, 1.05, -1.05));
    return f;
  }

  // ---- Fiat 500 (Cinquecento) : tiny, stubby, cute -----------------
  function cinque(body = '#f4c430') {
    const hw = 0.62, r = 0.36;
    const f = [];
    f.push(...box([-hw, r * 0.5, -1.15], [hw, 0.82, 1.15], body));
    // stubby domed cabin
    f.push(...box([-hw * 0.82, 0.82, -0.8], [hw * 0.82, 1.28, 0.55], GLASS, false));
    f.push(...box([-hw * 0.66, 1.24, -0.72], [hw * 0.66, 1.42, 0.48], body)); // roof
    // rear engine bump
    f.push({ v: [[-hw, 0.82, -0.6], [hw, 0.82, -0.6], [hw * 0.75, 0.6, -1.2], [-hw * 0.75, 0.6, -1.2]], color: body });
    f.push(...lights(1.12, 0.78, 0.44));
    f.push(...box([-hw, 0.5, 1.12], [hw, 0.68, 1.18], '#d9d9d9', false)); // bumper
    f.push(...wheels(hw, r, 0.78, -0.78));
    return f;
  }

  // ---- Porsche 930 : low, wide, sloped rear, whale-tail ------------
  function porsche(body = '#d81e29') {
    const hw = 0.85, r = 0.42;
    const f = [];
    f.push(...box([-hw, r * 0.5, -1.7], [hw, 0.82, 1.7], body)); // low wide body
    // sloped front hood
    f.push({ v: [[-hw, 0.82, 0.3], [hw, 0.82, 0.3], [hw * 0.85, 0.6, 1.72], [-hw * 0.85, 0.6, 1.72]], color: body });
    // cabin (low glass)
    f.push(...box([-hw * 0.82, 0.82, -0.45], [hw * 0.82, 1.24, 0.7], GLASS, false));
    // fastback sloped rear deck
    f.push({ v: [[-hw * 0.82, 1.24, -0.45], [hw * 0.82, 1.24, -0.45], [hw, 0.82, -1.7], [-hw, 0.82, -1.7]], color: body });
    // signature whale-tail spoiler
    f.push(...box([-hw * 0.9, 0.98, -1.55], [hw * 0.9, 1.08, -1.15], '#1a1a1a'));
    f.push(...box([-hw * 0.9, 0.82, -1.5], [-hw * 0.9 + 0.12, 1.0, -1.2], '#1a1a1a')); // strut L
    f.push(...box([hw * 0.9 - 0.12, 0.82, -1.5], [hw * 0.9, 1.0, -1.2], '#1a1a1a')); // strut R
    f.push(...lights(1.7, 0.72, 0.6));
    f.push(...wheels(hw, r, 1.15, -1.15));
    return f;
  }

  // Catalogue for the pick-a-car screen (names in easy hiragana).
  const list = [
    { id: 'mini', jp: 'ミニ', color: '#0b6e3b', build: () => mini() },
    { id: 'beetle', jp: 'ビートル', color: '#5bb7e6', build: () => beetle() },
    { id: 'cinque', jp: 'チンク', color: '#f4c430', build: () => cinque() },
    { id: 'porsche', jp: 'ポルシェ', color: '#d81e29', build: () => porsche() },
  ];

  function build(id) {
    const c = list.find((x) => x.id === id) || list[0];
    return c.build();
  }

  return { list, build, box };
})();
