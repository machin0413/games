"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";
import * as Tone from "tone";

// ─── Palette ─────────────────────────────────────────────────
const C = {
  bg: "#16141a", accent: "#ff8a8a", dim: "#9890ac",
  text: "#e8e2f0", mint: "#a0ffd0", gold: "#ffd070",
};

// ─── Levels (全8面、ソルバー検証済み) ─────────────────────────
const LEVELS = [
  { name:"Lv.1", hint:"★ · 5手", grid:[
    "########","#  .   #","#  $@  #","#      #","#  $   #","#  .   #","########",
  ]},
  { name:"Lv.2", hint:"★ · 2手", grid:[
    "#####","#@  #","# $ #","# . #","#   #","#####",
  ]},
  { name:"Lv.3", hint:"★ · 3手", grid:[
    "######","#@   #","## $ #","## . #","######",
  ]},
  { name:"Lv.4", hint:"★ · 20手", grid:[
    "#########","#       #","# .$.$. #","#  $.$  #","#   @   #","#########",
  ]},
  { name:"Lv.5", hint:"★★ · 18手", grid:[
    "########","#@     #","# $$$$ #","#      #","# .... #","########",
  ]},
  { name:"Lv.6", hint:"★★ · 15手", grid:[
    "########","#  @   #","# $.$  #","#  $ . #","# .#$  #","#  .   #","########",
  ]},
  { name:"Lv.7", hint:"★★ · 1手", grid:[
    "######","#@$. #","######",
  ]},
  { name:"Lv.8", hint:"★★ · 12手", grid:[
    "######","#@   #","# $  #","# $  #","# .  #","# .  #","######",
  ]},
  { name:"Lv.9", hint:"★★ · 23手", grid:[
    "#########","#@      #","# $$$$$ #","#       #","# ..... #","#  ##   #","#       #","#########",
  ]},
  { name:"Lv.10", hint:"★★ · 36手", grid:[
    "##########","#@       #","# $.$.$. #","# .$.$.$ #","##########",
  ]},
  { name:"Lv.11", hint:"★★ · 36手", grid:[
    "#######","#@    #","# $$  #","##.## #","# .   #","# $$. #","#  .  #","#######",
  ]},
  { name:"Lv.12", hint:"★★ · 24手", grid:[
    "##########","#@       #","# $.$.$. #","#  $.$.  #","#        #","##########",
  ]},
  { name:"Lv.13", hint:"★★ · 24手", grid:[
    "######","#@   #","# $  #","# $  #","# $  #","# .  #","# .  #","# .  #","######",
  ]},
  { name:"Lv.14", hint:"★★ · 22手", grid:[
    "#######","#  .  #","#  $  #","## ## #","#. $  #","#. $@ #","#######",
  ]},
  { name:"Lv.15", hint:"★★ · 19手", grid:[
    "##########","#@       #","# $$$    #","##  ##   #","# ...    #","##########",
  ]},
  { name:"Lv.16", hint:"★★ · 14手", grid:[
    "########","#  @   #","# $.   #","# .$   #","# $.   #","# .$   #","########",
  ]},
  { name:"Lv.17", hint:"★★ · 35手", grid:[
    "#########","#   #   #","# $ # $ #","## .#.  #","#  $#$  #","#  . .  #","#   @   #","#########",
  ]},
  { name:"Lv.18", hint:"★★ · 23手", grid:[
    "########","#@     #","# $$$  #","##  ## #","# ...  #","########",
  ]},
  { name:"Lv.19", hint:"★★ · 23手", grid:[
    "########","#      #","# .**$@#","#      #","#####  #","    #  #","    ####",
  ]},
  { name:"Lv.20", hint:"★★ · 14手", grid:[
    "########","#  @   #","# $.$. #","#  $.  #","# .$   #","#      #","########",
  ]},
  { name:"Lv.21", hint:"★★★ · 20手", grid:[
    "########","#@$ .  #","## $  ##","#  $   #","# .   ##","# .    #","########",
  ]},
  { name:"Lv.22", hint:"★★★ · 20手", grid:[
    "#######","#.$ . #","# $#$ #","#  $.@#","#.    #","#######",
  ]},
  { name:"Lv.23", hint:"★★★ · 38手", grid:[
    "#########","#   #   #","# $ . $ #","## $#.  #"," #  #.  #"," #@     #"," #########",
  ]},
  { name:"Lv.24", hint:"★★★ · 32手", grid:[
    "#########","#      ##","#@      #","# .#$## #","#$#     #","#. $   ##","#  .  # #","#########",
  ]},
  { name:"Lv.25", hint:"★★★ · 31手", grid:[
    "########","##  .  #","#  # $##","# $.   #","#@  .$ #","#   #  #","# #    #","########",
  ]},
  { name:"Lv.26", hint:"★★★ · 23手", grid:[
    "##########","# #      #","##   # $ #","#@#   #  #","# $.$.   #","#   #.   #","##########",
  ]},
  { name:"Lv.27", hint:"★★★ · 28手", grid:[
    "#########","# #. $. #","##   @$ #","#   #$# #","# .     #","# .$    #","#     # #","#########",
  ]},
  { name:"Lv.28", hint:"★★★ · 27手", grid:[
    "########","#  @   #","# $$   #","## ##  #","# ..   #","#  $$  #","#  ..  #","########",
  ]},
  { name:"Lv.29", hint:"★★★ · 24手", grid:[
    "########","#  .  @#","##$   .#","#. $#$##","#      #","#  #   #","########",
  ]},
  { name:"Lv.30", hint:"★★★ · 31手", grid:[
    "########","##  .  #","#  # $##","# $.   #","#@  .$ #","##  #  #","# #    #","########",
  ]},
  { name:"Lv.31", hint:"★★★ · 27手", grid:[
    "########","#  @   #","# $.$. #","##$.$ ##","# .$.  #","#  $.  #","########",
  ]},
  { name:"Lv.32", hint:"★★★ · 38手", grid:[
    "#########","#@      #","## #  # #","# $$ $  #","## # ## #","#  ...  #","#  $    #","#  .    #","#########",
  ]},
  { name:"Lv.33", hint:"★★★ · 36手", grid:[
    "########","#. . # #","# $@.# #","# $# $ #","#    # #","##     #","#      #","########",
  ]},
  { name:"Lv.34", hint:"★★★★ · 34手", grid:[
    "#########","#       #","#$#  $  #","#.      #","#  $    #","# @.$####","# #. .  #","#########",
  ]},
  { name:"Lv.35", hint:"★★★★ · 24手", grid:[
    "########","# ##   #","#  $  $#","#   @$.#","# # .  #","#  .#  #","########",
  ]},
  { name:"Lv.36", hint:"★★★★ · 37手", grid:[
    "#########","#   #   #","#   $ # #","#.   #  #","# ##.@  #","#$ $.#  #","#       #","#########",
  ]},
  { name:"Lv.37", hint:"★★★★ · 26手", grid:[
    "#########","#   .$  #","#   .@  #","# $.  # #","###  $ ##","#     # #","#########",
  ]},
  { name:"Lv.38", hint:"★★★★ · 42手", grid:[
    "########","#@     #","# $$   #","## ##  #"," # ..  #"," # $.  #"," #     #"," #######",
  ]},
  { name:"Lv.39", hint:"★★★★ · 37手", grid:[
    "########","#@     #","## # # #","# $$   #","## ##  #","#  ..  #","#  $$  #","#  ..  #","########",
  ]},
  { name:"Lv.40", hint:"★★★★ · 27手", grid:[
    "########","# @#   #","#$  #. #","#      #","#. #$  #","###. $ #","########",
  ]},
  { name:"Lv.41", hint:"★★★★ · 33手", grid:[
    "####  ","# .#  ","#  ###","#*@  #","#  $ #","#  ###","####  ",
  ]},
  { name:"Lv.42", hint:"★★★★ · 54手", grid:[
    "########","#@     #","# $    #","## ##  #","#  .   #","## ##  #","# $    #","## ##  #","#  .   #","########",
  ]},
  { name:"Lv.43", hint:"★★★★ · 35手", grid:[
    "########","#   @ ##","#   $ ##","#.   # #","#.   ###","# #  $ #","# $.   #","########",
  ]},
  { name:"Lv.44", hint:"★★★★ · 39手", grid:[
    "#########","#@  #   #","# $   $ #","#   #   #","# $ # $ #","#  ...  #","#   .   #","#########",
  ]},
  { name:"Lv.45", hint:"★★★★★ · 48手", grid:[
    "##########","# #    # #","#  .#    #","#    #$  #","#  $ $   #","# . #  @##","#.  #    #","##########",
  ]},
  { name:"Lv.46", hint:"★★★★★ · 36手", grid:[
    "########","#.@    #","# # $. #","####   #","#  $   #","#  $#  #","# .    #","########",
  ]},
  { name:"Lv.47", hint:"★★★★★ · 56手", grid:[
    "########","#   # ##","#@$ # .#","# $    #","#  #   #","#   # $#","# # . .#","########",
  ]},
  { name:"Lv.48", hint:"★★★★★ · 37手", grid:[
    "########","# . #  #","#   $ ##","# @ $  #","# $#   #","#  #  .#","##   . #","########",
  ]},
  { name:"Lv.49", hint:"★★★★★ · 46手", grid:[
    "##########","## #.    #","#.  #  . #","#  $$    #","##  #    #","#    @ $ #","#     # ##","##########",
  ]},
  { name:"Lv.50", hint:"★★★★★ · 75手", grid:[
    "########","#. ##  #","# . @ ##","#.  #  #","# $$ $ #","# #    #","########",
  ]},
];

// ─── Parse ───────────────────────────────────────────────────
function parseLevel(level) {
  const walls = new Set(), goals = new Set(), boxes = new Set();
  let playerPos = { x:1, y:1 };
  const gridW = Math.max(...level.grid.map(r => r.length));
  const gridH = level.grid.length;
  level.grid.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) {
      const ch = row[x];
      if (ch === "#") walls.add(`${x},${y}`);
      if (ch === "." || ch === "*" || ch === "+") goals.add(`${x},${y}`);
      if (ch === "$" || ch === "*") boxes.add(`${x},${y}`);
      if (ch === "@" || ch === "+") playerPos = { x, y };
    }
  });
  // Flood fill from player position to find all reachable floor tiles
  const floorTiles = new Set();
  const stack = [`${playerPos.x},${playerPos.y}`];
  while (stack.length > 0) {
    const key = stack.pop();
    if (floorTiles.has(key) || walls.has(key)) continue;
    const [fx, fy] = key.split(",").map(Number);
    if (fx < 0 || fy < 0 || fx >= gridW || fy >= gridH) continue;
    floorTiles.add(key);
    stack.push(`${fx+1},${fy}`, `${fx-1},${fy}`, `${fx},${fy+1}`, `${fx},${fy-1}`);
  }
  return { walls, goals, boxes, playerPos, gridW, gridH, floorTiles };
}

function isInGrid(x, y, gW, gH) { return x >= 0 && y >= 0 && x < gW && y < gH; }

function setCameraForGrid(camera, gridW, gridH) {
  const span = Math.max(gridW, gridH);
  camera.position.set(0, span * 1.6, span * 0.77);
  camera.lookAt(0, 0, span * 0.1);
  camera.up.set(0, 1, 0);
}

// ─── SFX (Tone.js) ───────────────────────────────────────────
let toneStarted = false;
async function ensureTone() {
  if (!toneStarted) { await Tone.start(); toneStarted = true; }
}
function playMove() {
  ensureTone().then(() => {
    const s = new Tone.Synth({ oscillator:{type:"triangle"}, envelope:{attack:0.005,decay:0.08,sustain:0,release:0.05} }).toDestination();
    s.volume.value = -18;
    s.triggerAttackRelease("C5", "32n");
    setTimeout(() => s.dispose(), 300);
  });
}
function playPush() {
  ensureTone().then(() => {
    const s = new Tone.Synth({ oscillator:{type:"square"}, envelope:{attack:0.005,decay:0.12,sustain:0,release:0.05} }).toDestination();
    s.volume.value = -22;
    s.triggerAttackRelease("G3", "16n");
    setTimeout(() => s.dispose(), 400);
  });
}
function playGoal() {
  ensureTone().then(() => {
    const s = new Tone.PolySynth(Tone.Synth).toDestination();
    s.volume.value = -16;
    s.triggerAttackRelease(["C4","E4","G4"], "8n");
    setTimeout(() => s.dispose(), 600);
  });
}
function playClear() {
  ensureTone().then(() => {
    const s = new Tone.PolySynth(Tone.Synth).toDestination();
    s.volume.value = -14;
    s.triggerAttackRelease(["C4","E4","G4","C5"], "4n");
    setTimeout(() => {
      s.triggerAttackRelease(["E4","G4","B4","E5"], "4n");
      setTimeout(() => s.dispose(), 800);
    }, 300);
  });
}

// ─── Particle system for clear ───────────────────────────────
function createParticles(scene) {
  const count = 80;
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(count * 3);
  const vel = [];
  for (let i = 0; i < count; i++) {
    pos[i*3] = (Math.random()-0.5) * 0.5;
    pos[i*3+1] = 1;
    pos[i*3+2] = (Math.random()-0.5) * 0.5;
    vel.push({
      x: (Math.random()-0.5) * 0.12,
      y: Math.random() * 0.14 + 0.04,
      z: (Math.random()-0.5) * 0.12,
    });
  }
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  const mat = new THREE.PointsMaterial({ color: 0x80ffc0, size: 0.18, transparent: true, opacity: 1 });
  const pts = new THREE.Points(geo, mat);
  pts.userData.dyn = true;
  pts.userData.vel = vel;
  pts.userData.life = 1.0;
  scene.add(pts);
  return pts;
}

// ─── Main Component ───────────────────────────────────────────
export default function Sokoban3D() {
  const mountRef   = useRef(null);
  const sceneRef   = useRef(null);
  const cameraRef  = useRef(null);
  const gameRef    = useRef({ moveCount:0, won:false, levelIdx:0, history:[], animQueue:[] });
  const [moves,      setMoves]      = useState(0);
  const [won,        setWon]        = useState(false);
  const [levelIdx,   setLevelIdx]   = useState(0);
  const [bestScores, setBestScores] = useState({});
  const [isAnimating, setIsAnimating] = useState(false);
  const [screen,     setScreen]     = useState("select"); // "select" | "game"


  // ── Three.js init ──────────────────────────────────────────
  useEffect(() => {
    if (screen !== "game") return;
    const mount = mountRef.current;
    if (!mount) return;
    const W = mount.clientWidth, H = mount.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x16141a);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(38, W/H, 0.1, 120);
    camera.position.set(0, 14, 9);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias:true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(W, H);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    mount.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xc8c0d8, 0.55));
    const key = new THREE.DirectionalLight(0xfff8f0, 1.6);
    key.position.set(4, 20, 12);
    key.castShadow = false; // 床のムラを防ぐ
    key.shadow.mapSize.set(2048, 2048);
    key.shadow.camera.left=-22; key.shadow.camera.right=22;
    key.shadow.camera.top=22;  key.shadow.camera.bottom=-22;
    key.shadow.camera.far=70;
    scene.add(key);
    scene.add(new THREE.DirectionalLight(0x8899cc, 0.35).position.set(-6,4,10) && (() => { const l = new THREE.DirectionalLight(0x8899cc, 0.35); l.position.set(-6,4,10); return l; })());
    const glow = new THREE.PointLight(0x80ffc0, 0.6, 22);
    glow.position.set(0, 3, 0);
    scene.add(glow);
    gameRef.current.glowLight = glow;

    let animId;
    const clock = new THREE.Clock();

    function animate() {
      animId = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();
      const dt = clock.getDelta ? 0.016 : 0.016;
      const st = gameRef.current.state;

      // player bob
      if (st?.playerMesh && !gameRef.current.animating) {
        st.playerMesh.position.y = Math.sin(t * 2.8) * 0.018;
      }

      // glow pulse
      if (gameRef.current.glowLight) {
        gameRef.current.glowLight.intensity = 0.55 + Math.sin(t * 2.2) * 0.12;
      }

      // smooth movement animation
      const aq = gameRef.current.animQueue;
      if (aq && aq.length > 0) {
        const anim = aq[0];
        anim.progress += 0.18; // speed
        const p = Math.min(anim.progress, 1);
        const ease = 1 - Math.pow(1 - p, 3); // ease-out cubic

        if (anim.playerMesh) {
          anim.playerMesh.position.x = anim.px0 + (anim.px1 - anim.px0) * ease;
          anim.playerMesh.position.z = anim.pz0 + (anim.pz1 - anim.pz0) * ease;
          // hop arc
          anim.playerMesh.position.y = Math.sin(p * Math.PI) * 0.3;
        }
        if (anim.boxMesh) {
          anim.boxMesh.position.x = anim.bx0 + (anim.bx1 - anim.bx0) * ease;
          anim.boxMesh.position.z = anim.bz0 + (anim.bz1 - anim.bz0) * ease;
          anim.boxMesh.position.y = 0.37 + Math.sin(p * Math.PI) * 0.15;
        }

        if (p >= 1) {
          aq.shift();
          if (aq.length === 0) {
            gameRef.current.animating = false;
            setIsAnimating(false);
            // check win after animation
            if (gameRef.current.pendingWin) {
              gameRef.current.pendingWin = false;
              gameRef.current.won = true;
              setWon(true);
              playClear();
              createParticles(scene);
            }
          }
        }
      }

      // particle update
      scene.children.filter(c => c.isPoints && c.userData.dyn).forEach(pts => {
        pts.userData.life -= 0.012;
        pts.material.opacity = Math.max(0, pts.userData.life);
        const pos = pts.geometry.attributes.position.array;
        const vel = pts.userData.vel;
        for (let i = 0; i < vel.length; i++) {
          pos[i*3]   += vel[i].x;
          pos[i*3+1] += vel[i].y;
          pos[i*3+2] += vel[i].z;
          vel[i].y   -= 0.006; // gravity
        }
        pts.geometry.attributes.position.needsUpdate = true;
        if (pts.userData.life <= 0) {
          scene.remove(pts);
          pts.geometry.dispose();
          pts.material.dispose();
        }
      });

      renderer.render(scene, camera);
    }
    animate();

    const onResize = () => {
      const w = mount.clientWidth, h = mount.clientHeight;
      camera.aspect = w/h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", onResize);
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
      renderer.dispose();
      sceneRef.current = null;
      cameraRef.current = null;
    };
  }, [screen]);

  // ── Build level ────────────────────────────────────────────
  const buildLevel = useCallback((idx) => {
    const scene = sceneRef.current;
    const camera = cameraRef.current;
    if (!scene) return;

    scene.children.filter(c => c.userData.dyn).forEach(c => {
      scene.remove(c);
      c.traverse(o => { if (o.isMesh) { o.geometry.dispose(); o.material.dispose(); } });
    });

    const level = LEVELS[idx];
    const parsed = parseLevel(level);
    const { walls, goals, gridW, gridH, floorTiles } = parsed;
    const boxes = new Set(parsed.boxes);
    const playerPos = { ...parsed.playerPos };
    const cx = (gridW-1)/2, cz = (gridH-1)/2;
    const toWorld = (x, y) => ({ wx: x-cx, wz: y-cz });
    const add = m => { m.userData.dyn = true; scene.add(m); return m; };

    const floorG = new THREE.BoxGeometry(0.98, 0.08, 0.98);
    const wallG  = new THREE.BoxGeometry(0.98, 1.1, 0.98);
    const wallCG = new THREE.BoxGeometry(0.98, 0.04, 0.98);
    const boxG   = new THREE.BoxGeometry(0.74, 0.74, 0.74);
    const goalG  = new THREE.CylinderGeometry(0.28, 0.28, 0.05, 22);
    const bodyG  = new THREE.CylinderGeometry(0.17, 0.22, 0.52, 14);
    const headG  = new THREE.SphereGeometry(0.18, 14, 14);

    const floorMat = new THREE.MeshStandardMaterial({ color:0x2c2a32, roughness:0.88, metalness:0.04 });
    const wallMat  = new THREE.MeshStandardMaterial({ color:0x3d3a50, roughness:0.72, metalness:0.18 });
    const wallCMat = new THREE.MeshStandardMaterial({ color:0x524e6a, roughness:0.6,  metalness:0.22 });
    const goalMat  = new THREE.MeshBasicMaterial({ color:0x80ffc0 });
    const mkBoxMat = onGoal => new THREE.MeshStandardMaterial(
      onGoal ? { color:0x6abf8e, emissive:0x3a9060, emissiveIntensity:0.35, roughness:0.35, metalness:0.45 }
             : { color:0xc8956a, roughness:0.5, metalness:0.28 }
    );
    const pMat = new THREE.MeshStandardMaterial({ color:0xe87070, emissive:0xb84040, emissiveIntensity:0.28, roughness:0.25, metalness:0.6 });

    floorTiles.forEach(key => {
      const [x, y] = key.split(",").map(Number);
      const { wx, wz } = toWorld(x, y);
      const f = add(new THREE.Mesh(floorG, floorMat));
      f.position.set(wx, -0.04, wz); f.receiveShadow = true;
    });
    walls.forEach(key => {
      const [x,y] = key.split(",").map(Number);
      const { wx, wz } = toWorld(x, y);
      const w = add(new THREE.Mesh(wallG, wallMat));
      w.position.set(wx, 0.55, wz); w.castShadow = true; w.receiveShadow = true;
      const cap = add(new THREE.Mesh(wallCG, wallCMat));
      cap.position.set(wx, 1.12, wz);
    });
    const goalMeshes = {};
    goals.forEach(key => {
      const [x,y] = key.split(",").map(Number);
      const { wx, wz } = toWorld(x, y);
      const gm = add(new THREE.Mesh(goalG, goalMat));
      gm.position.set(wx, 0.025, wz);
      goalMeshes[key] = gm;
    });
    const boxMeshes = {};
    boxes.forEach(key => {
      const [x,y] = key.split(",").map(Number);
      const { wx, wz } = toWorld(x, y);
      const bm = add(new THREE.Mesh(boxG, mkBoxMat(goals.has(key))));
      bm.position.set(wx, 0.37, wz); bm.castShadow = true; bm.receiveShadow = true;
      boxMeshes[key] = bm;
    });

    const pg = new THREE.Group(); pg.userData.dyn = true;
    const pb = new THREE.Mesh(bodyG, pMat); pb.position.y = 0.26; pb.castShadow = true;
    const ph = new THREE.Mesh(headG, pMat); ph.position.y = 0.62; ph.castShadow = true;
    pg.add(pb, ph);
    const { wx:ppx, wz:ppz } = toWorld(playerPos.x, playerPos.y);
    pg.position.set(ppx, 0, ppz);
    scene.add(pg);

    if (camera) setCameraForGrid(camera, gridW, gridH);

    gameRef.current.state = { walls, goals, boxes, boxMeshes, goalMeshes, playerPos, playerMesh:pg, gridW, gridH, toWorld, mkBoxMat };
    gameRef.current.moveCount = 0;
    gameRef.current.won = false;
    gameRef.current.levelIdx = idx;
    gameRef.current.history = [];
    gameRef.current.animQueue = [];
    gameRef.current.animating = false;
    gameRef.current.pendingWin = false;
    setMoves(0);
    setWon(false);
    setIsAnimating(false);
  }, []);

  useEffect(() => { if (sceneRef.current && screen === "game") buildLevel(levelIdx); }, [levelIdx, buildLevel, screen]);

  // ── Move (with animation + undo history) ──────────────────
  const move = useCallback((dx, dy) => {
    const g = gameRef.current;
    if (g.won || !g.state || g.animating) return;
    const { walls, goals, boxes, boxMeshes, playerPos, playerMesh, gridW, gridH, toWorld, mkBoxMat } = g.state;

    const nx = playerPos.x + dx, ny = playerPos.y + dy;
    const nk = `${nx},${ny}`;
    if (walls.has(nk) || !isInGrid(nx, ny, gridW, gridH)) return;

    let pushedBox = null;
    if (boxes.has(nk)) {
      const bnx = nx+dx, bny = ny+dy, bk = `${bnx},${bny}`;
      if (walls.has(bk) || boxes.has(bk) || !isInGrid(bnx, bny, gridW, gridH)) return;
      pushedBox = { fromKey:nk, toKey:bk, bnx, bny };
    }

    // save history snapshot（メッシュ参照を直接保存）
    g.history.push({
      playerPos: { ...playerPos },
      boxes: new Set(boxes),
      boxMeshMap: { ...boxMeshes }, // key -> mesh の参照コピー
    });

    // update state immediately
    if (pushedBox) {
      const { fromKey, toKey, bnx, bny } = pushedBox;
      boxes.delete(fromKey); boxes.add(toKey);
      const bm = boxMeshes[fromKey];
      const { wx:bwx, wz:bwz } = toWorld(bnx, bny);
      if (bm) {
        bm.material.dispose();
        bm.material = mkBoxMat(goals.has(toKey));
        delete boxMeshes[fromKey];
        boxMeshes[toKey] = bm;
        // queue box animation
        g.animQueue.push({
          progress:0,
          boxMesh: bm,
          bx0: bm.position.x, bz0: bm.position.z,
          bx1: bwx, bz1: bwz,
        });
      }
      if (goals.has(toKey)) playGoal(); else playPush();
    } else {
      playMove();
    }

    g.state.playerPos = { x:nx, y:ny };
    const { wx, wz } = toWorld(nx, ny);

    // queue player animation
    const anim = {
      progress:0,
      playerMesh: playerMesh,
      px0: playerMesh.position.x, pz0: playerMesh.position.z,
      px1: wx, pz1: wz,
    };
    // merge with box anim if exists
    if (g.animQueue.length > 0 && !g.animQueue[g.animQueue.length-1].playerMesh) {
      g.animQueue[g.animQueue.length-1].playerMesh = playerMesh;
      g.animQueue[g.animQueue.length-1].px0 = anim.px0;
      g.animQueue[g.animQueue.length-1].pz0 = anim.pz0;
      g.animQueue[g.animQueue.length-1].px1 = wx;
      g.animQueue[g.animQueue.length-1].pz1 = wz;
    } else {
      g.animQueue.push(anim);
    }

    g.animating = true;
    setIsAnimating(true);
    g.moveCount++;
    setMoves(g.moveCount);

    // win check
    if (goals.size > 0 && [...goals].every(gk => boxes.has(gk))) {
      g.pendingWin = true;
      setBestScores(prev => {
        const prevBest = prev[g.levelIdx];
        if (prevBest === undefined || g.moveCount < prevBest)
          return { ...prev, [g.levelIdx]: g.moveCount };
        return prev;
      });
    }
  }, []);

  // ── Undo ──────────────────────────────────────────────────
  const undo = useCallback(() => {
    const g = gameRef.current;
    if (!g.state || g.history.length === 0 || g.animating || g.won) return;
    const snap = g.history.pop();
    const { goals, boxMeshes, playerMesh, toWorld, mkBoxMat } = g.state;

    // boxMeshesマップをスナップショット通りに復元
    Object.keys(boxMeshes).forEach(k => delete boxMeshes[k]);
    Object.entries(snap.boxMeshMap).forEach(([key, bm]) => {
      // そのメッシュが本来いるべきワールド座標に戻す
      const [gx, gy] = key.split(",").map(Number);
      const { wx, wz } = toWorld(gx, gy);
      bm.position.set(wx, 0.37, wz);
      bm.material.dispose();
      bm.material = mkBoxMat(goals.has(key));
      boxMeshes[key] = bm;
    });

    // boxes状態を復元
    g.state.boxes = new Set(snap.boxes);

    // プレイヤーを復元
    g.state.playerPos = { ...snap.playerPos };
    const { wx, wz } = toWorld(snap.playerPos.x, snap.playerPos.y);
    if (playerMesh) playerMesh.position.set(wx, 0, wz);

    g.moveCount--;
    setMoves(g.moveCount);
    playMove();
  }, []);

  // ── Keyboard ──────────────────────────────────────────────
  useEffect(() => {
    const onKey = e => {
      if (["ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].includes(e.key)) e.preventDefault();
      if      (e.key==="ArrowUp"    || e.key==="w") move(0,-1);
      else if (e.key==="ArrowDown"  || e.key==="s") move(0, 1);
      else if (e.key==="ArrowLeft"  || e.key==="a") move(-1,0);
      else if (e.key==="ArrowRight" || e.key==="d") move( 1,0);
      else if (e.key==="r") buildLevel(gameRef.current.levelIdx ?? 0);
      else if (e.key==="z" || e.key==="Z") undo();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [move, undo, buildLevel]);

  // ── Swipe ────────────────────────────────────────────────
  useEffect(() => {
    const el = mountRef.current;
    if (!el) return;
    let startX = 0, startY = 0;
    const THRESHOLD = 24; // px

    const onTouchStart = e => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    };
    const onTouchEnd = e => {
      const dx = e.changedTouches[0].clientX - startX;
      const dy = e.changedTouches[0].clientY - startY;
      const ax = Math.abs(dx), ay = Math.abs(dy);
      if (Math.max(ax, ay) < THRESHOLD) return; // tap扱い
      if (ax > ay) {
        move(dx > 0 ? 1 : -1, 0);
      } else {
        move(0, dy > 0 ? 1 : -1);
      }
    };

    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchend", onTouchEnd, { passive: true });
    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchend", onTouchEnd);
    };
  }, [move, screen]);

  const resetLevel = () => buildLevel(gameRef.current.levelIdx ?? levelIdx);
  const goLevel = i => { gameRef.current.won = false; setLevelIdx(i); setScreen("game"); };

  // ── Level Select Screen ──────────────────────────────────
  if (screen === "select") {
    return (
      <div style={{ width:"100vw", height:"100vh", background:C.bg, display:"flex", flexDirection:"column", fontFamily:"'Courier New',monospace", overflow:"auto", userSelect:"none", WebkitUserSelect:"none" }}>
        {/* Title */}
        <div style={{ padding:"32px 20px 16px", textAlign:"center" }}>
          <div style={{ color:C.accent, fontSize:28, fontWeight:"bold", letterSpacing:8, lineHeight:1, textShadow:`0 0 24px ${C.accent}66` }}>HAKOOSHI</div>
          <div style={{ color:C.dim, fontSize:19, letterSpacing:6, marginTop:6 }}>箱　押　し</div>
        </div>

        {/* Stats */}
        <div style={{ textAlign:"center", padding:"4px 20px 18px", color:C.dim, fontSize:19, letterSpacing:2 }}>
          {Object.keys(bestScores).length} / {LEVELS.length} クリア
        </div>

        {/* Grid */}
        <div style={{
          display:"grid",
          gridTemplateColumns:"repeat(4, 1fr)",
          gap:10,
          padding:"0 16px 24px",
          maxWidth:480, margin:"0 auto", width:"100%",
          boxSizing:"border-box",
        }}>
          {LEVELS.map((lv, i) => {
            const isCleared = bestScores[i] !== undefined;
            return (
              <button key={i} onClick={() => goLevel(i)} style={{
                aspectRatio:"1", background: isCleared ? `${C.mint}11` : "rgba(255,255,255,0.025)",
                color: isCleared ? C.mint : C.text,
                border:`1px solid ${isCleared ? C.mint+"55" : C.dim+"44"}`,
                borderRadius:8, cursor:"pointer", fontFamily:"inherit",
                display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
                gap:4, transition:"all 0.15s", padding:0,
              }}>
                <span style={{ fontSize:22, fontWeight:"bold", letterSpacing:1 }}>{i+1}</span>
                {isCleared ? (
                  <span style={{ fontSize:20, color:C.gold, letterSpacing:1 }}>★ {bestScores[i]}</span>
                ) : (
                  <span style={{ fontSize:9, color:C.dim+"77", letterSpacing:2 }}>未クリア</span>
                )}
              </button>
            );
          })}
        </div>

        <div style={{ flex:1 }} />
        <div style={{ textAlign:"center", padding:"12px 0 18px", color:C.dim+"99", fontSize:19, letterSpacing:3 }}>
          TAP A LEVEL TO START
        </div>
      </div>
    );
  }

  // ── Game Screen ──────────────────────────────────────────
  return (
    <div style={{ width:"100vw", height:"100vh", background:C.bg, display:"flex", flexDirection:"column", fontFamily:"'Courier New',monospace", overflow:"hidden", userSelect:"none", WebkitUserSelect:"none" }}>

      {/* Header */}
      <div style={{ background:"rgba(255,255,255,0.02)", borderBottom:`1px solid ${C.dim}44`, flexShrink:0 }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"10px 16px" }}>
          <button onClick={() => setScreen("select")} style={{
            background:"transparent", color:C.dim, border:`1px solid ${C.dim}55`,
            borderRadius:4, padding:"3px 12px", cursor:"pointer", fontSize:20, fontFamily:"inherit",
          }}>← 一覧</button>
          <span style={{ color:C.accent, fontSize:20, fontWeight:"bold", letterSpacing:3 }}>Lv.{levelIdx+1}</span>
          <div style={{ display:"flex", gap:8, alignItems:"center" }}>
            <span style={{ color:C.text, fontSize:14, display:"flex", alignItems:"baseline", gap:6 }}>
              <span style={{ color:C.dim, fontSize:11, letterSpacing:1 }}>手数</span>
              <strong style={{ color:C.mint, fontSize:18 }}>{moves}</strong>
              {bestScores[levelIdx] !== undefined && (
                <span style={{ color:C.dim, fontSize:11, marginLeft:2 }}>
                  / <strong style={{ color:C.gold, fontSize:14 }}>{bestScores[levelIdx]}</strong>
                </span>
              )}
            </span>
            <button onClick={resetLevel} style={{ background:"transparent", color:C.dim, border:`1px solid ${C.dim}55`, borderRadius:4, padding:"3px 10px", cursor:"pointer", fontSize:20, fontFamily:"inherit" }}>リセット</button>
          </div>
        </div>
      </div>

      {/* Viewport */}
      <div ref={mountRef} style={{ flex:1, position:"relative" }}>
        {won && (
          <div style={{ position:"absolute", inset:0, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", background:"rgba(22,20,26,0.75)", zIndex:20, gap:10, backdropFilter:"blur(6px)" }}>
            <div style={{ fontSize:52, fontWeight:"bold", color:C.mint, textShadow:`0 0 40px ${C.mint}, 0 0 80px ${C.mint}66`, letterSpacing:4 }}>クリア！</div>
            <div style={{ color:C.text, fontSize:19, letterSpacing:3 }}>{moves} 手</div>
            {(() => {
              const prev = bestScores[levelIdx];
              const isNew = prev === undefined || moves < prev;
              return isNew
                ? <div style={{ color:C.gold, fontSize:20, letterSpacing:2, textShadow:`0 0 14px ${C.gold}` }}>★ NEW BEST!</div>
                : <div style={{ color:C.dim, fontSize:12 }}>ベスト {prev} 手</div>;
            })()}
            <div style={{ display:"flex", gap:10, marginTop:8 }}>
              <button onClick={resetLevel} style={{ background:"transparent", color:C.dim, border:`1px solid ${C.dim}66`, borderRadius:5, padding:"8px 16px", cursor:"pointer", fontSize:20, fontFamily:"inherit" }}>もう一度</button>
              {levelIdx < LEVELS.length-1 && (
                <button onClick={() => goLevel(levelIdx+1)} style={{ background:C.accent, color:"#fff", border:"none", borderRadius:5, padding:"8px 20px", cursor:"pointer", fontSize:19, fontFamily:"inherit", letterSpacing:2 }}>次のレベル →</button>
              )}
            </div>
          </div>
        )}
        <div style={{ position:"absolute", bottom:10, left:"50%", transform:"translateX(-50%)", color:`${C.dim}88`, fontSize:20, letterSpacing:2, pointerEvents:"none", whiteSpace:"nowrap" }}>
          スワイプで移動
        </div>
      </div>

      {/* D-pad */}
      <div style={{ display:"flex", flexDirection:"column", alignItems:"center", padding:"8px 0 12px", gap:4, background:"rgba(0,0,0,0.25)", borderTop:`1px solid ${C.dim}33`, flexShrink:0 }}>
        <Pad onClick={() => move(0,-1)} c={C}>▲</Pad>
        <div style={{ display:"flex", gap:4, alignItems:"center" }}>
          <Pad onClick={() => move(-1,0)} c={C}>◀</Pad>
          <div style={{ width:44, height:44, display:"flex", alignItems:"center", justifyContent:"center" }}>
            <button onClick={undo} onMouseDown={e=>e.preventDefault()} style={{ background:"rgba(255,255,255,0.06)", color:C.dim, border:`1px solid ${C.dim}44`, borderRadius:6, width:36, height:36, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", userSelect:"none" }}><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 14 4 9 9 4"/><path d="M4 9h10a5 5 0 0 1 0 10h-1"/></svg></button>
          </div>
          <Pad onClick={() => move(1,0)} c={C}>▶</Pad>
        </div>
        <Pad onClick={() => move(0,1)} c={C}>▼</Pad>
      </div>
    </div>
  );
}

const ARROWS = {
  "▲": <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15"/></svg>,
  "▼": <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>,
  "◀": <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>,
  "▶": <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>,
};

const Pad = ({ onClick, children, c }) => (
  <button
    onClick={onClick}
    onMouseDown={e => e.preventDefault()}
    style={{ width:44, height:44, background:"rgba(255,255,255,0.04)", color:c.text, border:`1px solid ${c.dim}55`, borderRadius:8, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", userSelect:"none", WebkitUserSelect:"none" }}
  >
    {ARROWS[children] ?? children}
  </button>
);
