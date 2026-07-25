// ===================================================================
//  Mini 3D Engine  --  dependency-free software renderer on 2D canvas
//  Projects 3D polygons to screen, sorts back-to-front (painter's
//  algorithm) and fills them. Just enough 3D for a friendly kids' game.
// ===================================================================

const Engine = (() => {
  'use strict';

  // ---- tiny vector helpers -----------------------------------------
  const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  const cross = (a, b) => [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ];
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const norm = (a) => {
    const l = Math.hypot(a[0], a[1], a[2]) || 1;
    return [a[0] / l, a[1] / l, a[2] / l];
  };

  const LIGHT = norm([0.4, 1.0, 0.35]); // direction the sun comes from

  // Camera state (set every frame by the game).
  const cam = { x: 0, y: 4, z: -8, yaw: 0, pitch: 0.28, fov: 1.05 };

  // Rotate a local model point by yaw around Y then translate to world.
  function place(p, ox, oy, oz, yaw) {
    const c = Math.cos(yaw), s = Math.sin(yaw);
    return [
      p[0] * c + p[2] * s + ox,
      p[1] + oy,
      -p[0] * s + p[2] * c + oz,
    ];
  }

  // World point -> view space (relative to camera).
  function toView(p) {
    const dx = p[0] - cam.x, dy = p[1] - cam.y, dz = p[2] - cam.z;
    const cy = Math.cos(cam.yaw), sy = Math.sin(cam.yaw);
    // yaw
    let x = dx * cy - dz * sy;
    let z = dx * sy + dz * cy;
    let y = dy;
    // pitch (tilt camera to look slightly down)
    const cp = Math.cos(cam.pitch), sp = Math.sin(cam.pitch);
    const y2 = y * cp + z * sp;
    const z2 = -y * sp + z * cp;
    return [x, y2, z2];
  }

  // ---- the scene: a flat list of polygons to draw this frame -------
  let polys = [];
  function reset() { polys.length = 0; }

  // Add a polygon. pts are WORLD-space [x,y,z]. color is base hex.
  // If shade is true the face is lit by the sun for a low-poly look.
  function add(pts, color, shade = true) {
    polys.push({ pts, color, shade });
  }

  // Convenience: add a model (array of {v:[[x,y,z]...], color, shade?})
  // placed at (ox,oy,oz) rotated by yaw.
  function addModel(model, ox, oy, oz, yaw) {
    for (const f of model) {
      const w = f.v.map((p) => place(p, ox, oy, oz, yaw));
      add(w, f.color, f.shade !== false);
    }
  }

  // Shade a hex color by a 0..1 brightness factor.
  function shadeHex(hex, k) {
    const n = parseInt(hex.slice(1), 16);
    let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    r = Math.min(255, r * k) | 0;
    g = Math.min(255, g * k) | 0;
    b = Math.min(255, b * k) | 0;
    return 'rgb(' + r + ',' + g + ',' + b + ')';
  }

  // ---- render ------------------------------------------------------
  function render(ctx, W, H) {
    const focal = (H / 2) / Math.tan(cam.fov / 2);
    const cx = W / 2, cyc = H / 2;
    const near = 0.4;

    const draw = [];
    for (const poly of polys) {
      const view = poly.pts.map(toView);
      // near-plane cull: skip polygons with any vertex too close/behind
      let behind = false, sumZ = 0;
      for (const v of view) { if (v[2] < near) { behind = true; break; } sumZ += v[2]; }
      if (behind) continue;
      const n = view.length;
      const avgZ = sumZ / n;

      // project
      const sp = new Array(n);
      for (let i = 0; i < n; i++) {
        const v = view[i];
        sp[i] = [cx + (v[0] / v[2]) * focal, cyc - (v[1] / v[2]) * focal];
      }

      // flat shading from world-space normal
      let col = poly.color;
      if (poly.shade) {
        const nrm = norm(cross(sub(poly.pts[1], poly.pts[0]),
                              sub(poly.pts[2], poly.pts[0])));
        let b = dot(nrm, LIGHT);
        b = 0.55 + 0.45 * Math.abs(b); // soft, never fully dark
        col = shadeHex(poly.color, b);
      }
      draw.push({ sp, col, z: avgZ });
    }

    // far -> near
    draw.sort((a, b) => b.z - a.z);

    for (const d of draw) {
      ctx.beginPath();
      ctx.moveTo(d.sp[0][0], d.sp[0][1]);
      for (let i = 1; i < d.sp.length; i++) ctx.lineTo(d.sp[i][0], d.sp[i][1]);
      ctx.closePath();
      ctx.fillStyle = d.col;
      ctx.fill();
    }
  }

  // Project a single world point to screen (for HUD markers like the
  // sparkle on a star). Returns null if behind camera.
  function project(p, W, H) {
    const v = toView(p);
    if (v[2] < 0.4) return null;
    const focal = (H / 2) / Math.tan(cam.fov / 2);
    return { x: W / 2 + (v[0] / v[2]) * focal, y: H / 2 - (v[1] / v[2]) * focal, z: v[2] };
  }

  return { cam, reset, add, addModel, render, project, shadeHex };
})();
