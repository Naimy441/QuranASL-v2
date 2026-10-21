import * as THREE from "three";
import { BODY } from "../asl/body";
import { buildHandRig, type HandRig } from "./handRig";
import type { Pose } from "../asl/timeline";
import type { FaceState, HandSide } from "../asl/types";

// The avatar's skeleton (shoulders, arm lengths, hand dimensions, head ellipsoid)
// is fixed by BODY and HAND_DIMS because the sign compiler places contacts on it.
// Everything here is surface: a sculpted head, fabric, a hijab, continuous
// sleeves. Signers wear plain dark tops so the hands read clearly, as human
// interpreters do.

export interface AvatarStyle {
  skin: string;
  top: string;
  accent: string;
  headwear: "hijab" | "kufi" | "none";
  hijab: string;
  /** Under-scarf band showing at the forehead (hijab only). */
  underscarf?: string;
  beard: boolean;
  hair: string;
  iris?: string;
  flat?: boolean; // 2D / flat shaded look
}

export const AVATAR_PRESETS: Record<string, AvatarStyle> = {
  amina: { skin: "#c48a66", top: "#18394a", accent: "#d6b06a", headwear: "hijab", hijab: "#6d4a5c", underscarf: "#efe4d6", beard: false, hair: "#2a1d17", iris: "#4a2f1d" },
  maryam: { skin: "#7a4a33", top: "#2a2236", accent: "#caa25c", headwear: "hijab", hijab: "#1f3a4c", underscarf: "#0f1f29", beard: false, hair: "#120c09", iris: "#2a1a10" },
  yusuf: { skin: "#a8724f", top: "#26392e", accent: "#c9a25a", headwear: "kufi", hijab: "#f3efe6", beard: true, hair: "#1d1510", iris: "#3a2618" },
  sam: { skin: "#e0b493", top: "#232a3a", accent: "#6aa6d9", headwear: "none", hijab: "#333", beard: false, hair: "#4a3322", iris: "#3d5a73" },
};

const UP = new THREE.Vector3(0, 1, 0);
const v1 = new THREE.Vector3(), v2 = new THREE.Vector3(), v3 = new THREE.Vector3(), v4 = new THREE.Vector3();
const qTmp = new THREE.Quaternion();

/** Two-bone IK: returns elbow position. */
function solveElbow(S: THREE.Vector3, W: THREE.Vector3, pole: THREE.Vector3, l1: number, l2: number, out: THREE.Vector3) {
  const d = v1.subVectors(W, S);
  let len = d.length();
  const maxLen = (l1 + l2) * 0.999;
  if (len > maxLen) {
    d.multiplyScalar(maxLen / len);
    W.copy(S).add(d);
    len = maxLen;
  }
  len = Math.max(len, Math.abs(l1 - l2) + 1e-3);
  const dir = d.normalize();
  const cosA = (l1 * l1 + len * len - l2 * l2) / (2 * l1 * len);
  const sinA = Math.sqrt(Math.max(0, 1 - cosA * cosA));
  const perp = v2.subVectors(pole, S);
  perp.addScaledVector(dir, -perp.dot(dir));
  if (perp.lengthSq() < 1e-8) perp.set(0, -1, 0);
  perp.normalize();
  return out.copy(S).addScaledVector(dir, l1 * cosA).addScaledVector(perp, l1 * sinA);
}

/** Torso lathe profile: (radius, height above the hips). */
const TORSO_PROFILE: [number, number][] = [
  [0.0, -0.03], [0.15, -0.03], [0.162, 0.04], [0.156, 0.12], [0.15, 0.2], [0.157, 0.28], [0.168, 0.34], [0.177, 0.39],
  [0.178, 0.425], [0.162, 0.455], [0.125, 0.474], [0.075, 0.484], [0.0, 0.488],
];
const TORSO_DEPTH = 0.62;
/** z of the front of the torso at height h above the hips. */
function torsoFront(h: number) {
  const P = TORSO_PROFILE;
  if (h <= P[1][1]) return P[1][0] * TORSO_DEPTH;
  for (let i = 1; i < P.length - 1; i++) {
    const [r0, y0] = P[i], [r1, y1] = P[i + 1];
    if (h <= y1) return (r0 + ((r1 - r0) * (h - y0)) / (y1 - y0)) * TORSO_DEPTH;
  }
  return 0;
}

const gauss = (dx: number, dy: number, s: number) => Math.exp(-(dx * dx + dy * dy) / (2 * s * s));

/**
 * Facial relief in metres, pushed out along the head ellipsoid's radial
 * direction. (ux, uy) are unit-sphere coordinates, `front` = max(0, uz).
 */
function faceRelief(ux: number, uy: number, front: number) {
  const f2 = front * front;
  const ax = Math.abs(ux);
  let d = 0;
  d += f2 * 0.0042 * gauss(ax - 0.5, uy + 0.08, 0.17); // cheekbones
  d -= f2 * 0.0048 * gauss(ax - 0.37, uy - 0.19, 0.11); // eye sockets
  d += f2 * 0.0026 * gauss(ux / 2.6, uy - 0.34, 0.07); // brow ridge
  // nose: a ridge from between the eyes to the tip, wider at the nostrils
  const f4 = f2 * f2;
  if (uy < 0.24 && uy > -0.24) {
    const h = uy > -0.1 ? 0.0135 * (0.24 - uy) / 0.34 : 0.0135 * Math.max(0, 1 - (-0.1 - uy) / 0.13);
    const w = 0.05 + 0.07 * Math.max(0, (0.24 - uy) / 0.34);
    d += f4 * h * Math.exp(-(ux * ux) / (2 * w * w));
  }
  d += f4 * 0.0042 * gauss(ux, uy + 0.1, 0.07); // tip
  d += f4 * 0.0032 * gauss(ax - 0.11, uy + 0.15, 0.05); // nostril wings
  d += f2 * 0.0022 * gauss(ux / 1.4, uy + 0.34, 0.05); // philtrum / upper lip
  d -= f2 * 0.0018 * gauss(ux / 1.8, uy + 0.56, 0.04); // groove under the lower lip
  d += f2 * 0.0062 * gauss(ux / 1.3, uy + 0.7, 0.13); // chin
  return d;
}

function sculptHead(): THREE.BufferGeometry {
  const { rx, ry, rz } = BODY.head;
  const g = new THREE.SphereGeometry(1, 128, 96);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const ux = p.getX(i), uy = p.getY(i), uz = p.getZ(i);
    let X = ux * rx, Z = uz * rz;
    const Y = uy * ry;
    // lower face narrows toward the jaw and chin
    if (uy < 0.0) {
      const k = Math.min(1, -uy / 1.0);
      X *= 1 - 0.26 * k * k;
      if (uz < 0) Z *= 1 - 0.3 * k * k;
    }
    // fuller cheeks so the face reads less narrow
    if (uz > 0 && uy > -0.55 && uy < 0.35) X *= 1 + 0.05 * uz * Math.cos(((uy + 0.1) / 0.45) * (Math.PI / 2));
    // a little fuller at the back of the skull
    if (uz < 0 && uy > -0.2) Z *= 1.05;
    const d = faceRelief(ux, uy, Math.max(0, uz));
    p.setXYZ(i, X + ux * d, Y + uy * d, Z + uz * d);
  }
  g.computeVertexNormals();
  return g;
}

/** Tapered eyebrow: a crescent in the x-y plane, inner end at the origin, pointing outward along +x. */
function browGeometry() {
  const s = new THREE.Shape();
  const L = 0.03;
  s.moveTo(0, -0.0024);
  s.bezierCurveTo(L * 0.35, 0.0006, L * 0.7, 0.0012, L, -0.0006);
  s.bezierCurveTo(L * 0.7, 0.0032, L * 0.35, 0.0046, 0, 0.0028);
  s.closePath();
  const g = new THREE.ExtrudeGeometry(s, { depth: 0.0012, bevelEnabled: true, bevelThickness: 0.0008, bevelSize: 0.0007, bevelSegments: 2, curveSegments: 10 });
  g.translate(-0.002, 0, -0.001);
  return g;
}

/**
 * A sleeve or other tube that follows S → E → W with a rounded elbow, rebuilt
 * in place every frame (fixed vertex count, no allocation).
 */
class FlexTube {
  readonly mesh: THREE.Mesh;
  private geo = new THREE.BufferGeometry();
  private readonly rings: number;
  private readonly seg = 22;
  private pts: THREE.Vector3[];
  private rad: Float32Array;
  private tmpN = new THREE.Vector3();
  private tmpB = new THREE.Vector3();
  private tmpT = new THREE.Vector3();

  constructor(mat: THREE.Material, rings = 34) {
    this.rings = rings;
    const nv = (rings + 2) * (this.seg + 1);
    this.geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(nv * 3), 3));
    this.geo.setAttribute("normal", new THREE.BufferAttribute(new Float32Array(nv * 3), 3));
    const idx: number[] = [];
    for (let r = 0; r < rings + 1; r++)
      for (let s = 0; s < this.seg; s++) {
        const a = r * (this.seg + 1) + s, b = a + this.seg + 1;
        idx.push(a, b, a + 1, b, b + 1, a + 1);
      }
    this.geo.setIndex(idx);
    this.pts = Array.from({ length: rings + 2 }, () => new THREE.Vector3());
    this.rad = new Float32Array(rings + 2);
    this.mesh = new THREE.Mesh(this.geo, mat);
    this.mesh.castShadow = true;
    this.mesh.frustumCulled = false;
  }

  /** r0 at S, r1 at the elbow, r2 at the end; the last ring folds inward to show a hem. */
  update(S: THREE.Vector3, E: THREE.Vector3, W: THREE.Vector3, r0: number, r1: number, r2: number, round = 0.32) {
    const n = this.rings;
    const lu = S.distanceTo(E), lf = E.distanceTo(W);
    const k = Math.min(lu, lf) * round;
    const P1 = v1.copy(E).addScaledVector(v2.subVectors(S, E).normalize(), k);
    const P2 = v3.copy(E).addScaledVector(v4.subVectors(W, E).normalize(), k);
    const total = lu - k + lf - k + k * 1.6;
    for (let i = 0; i <= n; i++) {
      const d = (i / n) * total;
      const p = this.pts[i];
      let r: number;
      if (d <= lu - k) {
        p.lerpVectors(S, P1, d / Math.max(1e-6, lu - k));
        r = r0 + (r1 - r0) * (d / lu);
      } else if (d <= lu - k + k * 1.6) {
        const t = (d - (lu - k)) / (k * 1.6);
        const a = (1 - t) * (1 - t), b = 2 * (1 - t) * t, c = t * t;
        p.set(a * P1.x + b * E.x + c * P2.x, a * P1.y + b * E.y + c * P2.y, a * P1.z + b * E.z + c * P2.z);
        r = r1 * (1 + 0.08 * Math.sin(t * Math.PI));
      } else {
        const t = (d - (lu - k + k * 1.6)) / Math.max(1e-6, lf - k);
        p.lerpVectors(P2, W, t);
        r = r1 + (r2 - r1) * t;
        if (t > 0.86) r *= 1 + ((t - 0.86) / 0.14) * 0.12; // cuff flare
      }
      this.rad[i] = r;
    }
    // inward hem ring, set back slightly inside the cuff
    this.pts[n + 1].copy(this.pts[n]).addScaledVector(v4.subVectors(this.pts[n], this.pts[n - 1]).normalize(), -0.006);
    this.rad[n + 1] = this.rad[n] * 0.72;

    const pos = this.geo.attributes.position as THREE.BufferAttribute;
    const T = this.tmpT, N = this.tmpN, B = this.tmpB;
    // initial frame: normal perpendicular to the first tangent
    T.subVectors(this.pts[1], this.pts[0]).normalize();
    N.set(0, 0, 1);
    if (Math.abs(T.dot(N)) > 0.9) N.set(1, 0, 0);
    N.addScaledVector(T, -N.dot(T)).normalize();
    for (let i = 0; i <= n + 1; i++) {
      const j = Math.min(n, i);
      const prev = this.pts[Math.max(0, j - 1)], next = this.pts[Math.min(n, j + 1)];
      const t2 = v2.subVectors(next, prev).normalize();
      // parallel transport
      N.addScaledVector(t2, -N.dot(t2)).normalize();
      B.crossVectors(t2, N);
      const c = this.pts[i], r = this.rad[i];
      for (let s = 0; s <= this.seg; s++) {
        const a = (s / this.seg) * Math.PI * 2;
        const ca = Math.cos(a) * r, sa = Math.sin(a) * r;
        pos.setXYZ(i * (this.seg + 1) + s, c.x + N.x * ca + B.x * sa, c.y + N.y * ca + B.y * sa, c.z + N.z * ca + B.z * sa);
      }
    }
    pos.needsUpdate = true;
    this.geo.computeVertexNormals();
    this.geo.computeBoundingSphere();
  }
}

/** Lathe from a (radius, height) profile with optional fabric folds. */
function lathe(profile: [number, number][], segs: number, folds?: { count: number; amp: (y: number) => number; phase?: number }) {
  const g = new THREE.LatheGeometry(profile.map(([r, y]) => new THREE.Vector2(r, y)), segs);
  if (folds) {
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
      const r = Math.hypot(x, z);
      if (r < 1e-5) continue;
      const ang = Math.atan2(z, x);
      const a = folds.amp(y);
      if (!a) continue;
      const off = a * (Math.sin(ang * folds.count + (folds.phase ?? 0)) * 0.7 + Math.sin(ang * folds.count * 2.3 + 1.7) * 0.3);
      p.setXYZ(i, x * (1 + off / r), y, z * (1 + off / r));
    }
  }
  g.computeVertexNormals();
  return g;
}

export class AvatarRig {
  group = new THREE.Group();
  torso = new THREE.Group();
  headPivot = new THREE.Group();
  head = new THREE.Group();
  hands: Record<HandSide, HandRig>;
  armsFrame = new THREE.Group();
  private sleeves: Record<HandSide, FlexTube>;
  private wrists: Record<HandSide, THREE.Mesh>;
  private mats: Record<string, THREE.Material> = {};
  private brows: THREE.Object3D[] = [];
  private lids: THREE.Object3D[] = [];
  private irises: THREE.Object3D[] = [];
  private cheeks: THREE.Mesh[] = [];
  private lipU!: THREE.Mesh;
  private lipL!: THREE.Mesh;
  private mouthInner!: THREE.Mesh;
  private teeth!: THREE.Mesh;
  private mouthG!: THREE.Group;
  private lipKey = "";
  private blinkPhase = Math.random() * 3;
  private saccade = { x: 0, y: 0, next: 0 };
  style: AvatarStyle;

  constructor(style: AvatarStyle = AVATAR_PRESETS.amina) {
    this.style = style;
    const skinCol = new THREE.Color(style.skin);
    const skin = new THREE.MeshPhysicalMaterial({
      color: skinCol,
      roughness: 0.5,
      sheen: 0.4,
      sheenRoughness: 0.5,
      sheenColor: skinCol.clone().lerp(new THREE.Color("#ffd6bf"), 0.55),
      clearcoat: 0.06,
      clearcoatRoughness: 0.55,
    });
    const cloth = (c: string, sheen = 0.9) => {
      const col = new THREE.Color(c);
      return new THREE.MeshPhysicalMaterial({
        color: col,
        roughness: 0.86,
        sheen,
        sheenRoughness: 0.42,
        sheenColor: col.clone().lerp(new THREE.Color("#ffffff"), 0.32),
        side: THREE.DoubleSide,
        shadowSide: THREE.FrontSide,
      });
    };
    const std = (c: string | THREE.Color, rough = 0.5, extra: Partial<THREE.MeshStandardMaterialParameters> = {}) =>
      new THREE.MeshStandardMaterial({ color: c, roughness: rough, metalness: 0, ...extra });
    this.mats = {
      skin,
      top: cloth(style.top),
      accent: std(style.accent, 0.38, { metalness: 0.35 }),
      dark: std("#120d0b", 0.45),
      white: new THREE.MeshPhysicalMaterial({ color: "#f7f3ee", roughness: 0.18, clearcoat: 0.6, clearcoatRoughness: 0.1 }),
      iris: new THREE.MeshPhysicalMaterial({ color: style.iris ?? "#3a2618", roughness: 0.25, clearcoat: 1, clearcoatRoughness: 0.05 }),
      lip: std(skinCol.clone().lerp(new THREE.Color("#b45a55"), 0.4).multiplyScalar(0.92), 0.34),
      mouth: std("#3a1512", 0.8),
      hijab: cloth(style.hijab, 1),
      under: cloth(style.underscarf ?? style.hijab, 0.6),
      hair: std(style.hair, 0.62),
      nail: std(skinCol.clone().lerp(new THREE.Color("#ffe9e0"), 0.45), 0.3),
      brow: std(new THREE.Color(style.hair).multiplyScalar(0.9), 0.8),
      lower: cloth(new THREE.Color(style.top).multiplyScalar(0.82).getStyle()),
      lash: std("#0b0807", 0.6),
    };
    this.group.add(this.torso);
    this.torso.position.y = BODY.hipY;
    this.buildBody();
    this.buildHead();
    this.hands = {
      R: buildHandRig("R", { skin: this.mats.skin, nail: this.mats.nail }),
      L: buildHandRig("L", { skin: this.mats.skin, nail: this.mats.nail }),
    };
    this.sleeves = { R: new FlexTube(this.mats.top), L: new FlexTube(this.mats.top) };
    const wristGeo = new THREE.CylinderGeometry(0.0235, 0.027, 1, 20, 1, true).translate(0, 0.5, 0);
    this.wrists = { R: new THREE.Mesh(wristGeo, this.mats.skin), L: new THREE.Mesh(wristGeo, this.mats.skin) };
    for (const s of ["R", "L"] as HandSide[]) {
      // arms & hands live in torso space but the torso group is offset by hipY,
      // so they go in an "arms" frame that cancels that offset.
      this.armsFrame.add(this.sleeves[s].mesh, this.wrists[s], this.hands[s].root);
    }
  }

  private buildBody() {
    const { mats } = this;
    const T = this.torso;
    this.armsFrame.position.y = -BODY.hipY;
    T.add(this.armsFrame);
    // Torso: a smooth lathe (radius, height above hips), flattened front-to-back.
    const torsoMesh = new THREE.Mesh(lathe(TORSO_PROFILE, 64), mats.top);
    torsoMesh.scale.set(1, 1, TORSO_DEPTH);
    torsoMesh.castShadow = torsoMesh.receiveShadow = true;
    T.add(torsoMesh);
    // shoulders: rounded caps where the sleeves begin
    for (const sx of [-1, 1]) {
      const sh = new THREE.Mesh(new THREE.SphereGeometry(0.05, 28, 20), mats.top);
      sh.position.set(sx * (BODY.shoulder.x - 0.012), BODY.shoulder.y - BODY.hipY - 0.014, BODY.shoulder.z);
      sh.scale.set(1.02, 0.8, 0.9);
      sh.castShadow = true;
      T.add(sh);
    }
    // neckline trim
    const collar = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.0045, 10, 48), mats.accent);
    collar.rotation.x = Math.PI / 2 + 0.25;
    collar.scale.set(1, 0.82, 1);
    collar.position.set(0, BODY.neckBase.y - BODY.hipY + 0.006, 0.012);
    if (this.style.headwear !== "hijab") T.add(collar);

    // neck
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.041, 0.05, 0.12, 28), mats.skin);
    neck.position.set(0, BODY.neckBase.y - BODY.hipY + 0.045, 0.0);
    T.add(neck);
    // lower body: a long garment with soft folds toward the hem
    const robeProf: [number, number][] = [[0, 0.0], [0.152, 0.0], [0.17, -0.12], [0.19, -0.32], [0.212, -0.56], [0.232, -0.8], [0.242, -0.9], [0.0, -0.9]];
    const robe = new THREE.Mesh(
      lathe(robeProf, 96, { count: 11, amp: (y) => (y < -0.1 ? Math.min(1, (-y - 0.1) / 0.6) * 0.008 : 0) }),
      mats.lower,
    );
    robe.scale.set(1, 1, 0.7);
    robe.castShadow = true;
    T.add(robe);
    for (const sx of [-1, 1]) {
      const foot = new THREE.Mesh(new THREE.SphereGeometry(0.05, 18, 12), mats.dark);
      foot.scale.set(0.9, 0.42, 1.9);
      foot.position.set(sx * 0.09, -0.955, 0.07);
      T.add(foot);
    }
    // head pivot at the neck
    this.headPivot.position.set(0, BODY.neckBase.y - BODY.hipY + 0.06, 0);
    T.add(this.headPivot);
    this.headPivot.add(this.head);
    this.head.position.set(0, BODY.head.y - BODY.neckBase.y - 0.06, BODY.head.z);
  }

  private buildHead() {
    const { mats, style } = this;
    const H = this.head;
    const { rx, ry, rz } = BODY.head;
    /** z of the sculpted head surface at (x, y). */
    const surf = (x: number, y: number) => {
      const ux = x / rx, uy = y / ry;
      const uz = Math.sqrt(Math.max(0, 1 - ux * ux - uy * uy));
      return rz * uz + uz * faceRelief(ux, uy, uz);
    };
    const skull = new THREE.Mesh(sculptHead(), mats.skin);
    skull.castShadow = true;
    H.add(skull);
    // ears
    for (const sx of [-1, 1]) {
      const ear = new THREE.Mesh(new THREE.SphereGeometry(0.017, 16, 12), mats.skin);
      ear.scale.set(0.42, 1.35, 0.85);
      ear.position.set(sx * rx * 0.97, 0.004, -0.008);
      ear.rotation.y = sx * -0.35;
      H.add(ear);
    }
    // eyes
    const eyeY = 0.02, eyeX = 0.031;
    for (const sx of [-1, 1]) {
      const eyeG = new THREE.Group();
      eyeG.position.set(sx * eyeX, eyeY, surf(eyeX, eyeY) - 0.0062);
      eyeG.rotation.y = sx * 0.2;
      eyeG.scale.setScalar(1.08);
      const white = new THREE.Mesh(new THREE.SphereGeometry(0.0126, 28, 20), mats.white);
      white.scale.set(1.16, 0.8, 0.72);
      eyeG.add(white);
      const irisG = new THREE.Object3D();
      const iris = new THREE.Mesh(new THREE.SphereGeometry(0.0078, 24, 16), mats.iris);
      iris.position.z = 0.0063;
      iris.scale.set(1, 1, 0.5);
      const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.0037, 14, 10), mats.dark);
      pupil.position.z = 0.0094;
      pupil.scale.set(1, 1, 0.4);
      const glint = new THREE.Mesh(new THREE.SphereGeometry(0.0012, 8, 6), new THREE.MeshBasicMaterial({ color: "#ffffff" }));
      glint.position.set(0.0022, 0.0024, 0.0104);
      irisG.add(iris, pupil, glint);
      eyeG.add(irisG);
      this.irises.push(irisG);
      // upper lid: a skin cap that rotates down to close, with a lash line on its edge
      const lid = new THREE.Group();
      const cap = new THREE.Mesh(new THREE.SphereGeometry(0.0136, 28, 12, 0, Math.PI * 2, 0, Math.PI / 2), mats.skin);
      cap.scale.set(1.2, 0.9, 0.8);
      const lash = new THREE.Mesh(new THREE.TorusGeometry(0.0136, 0.00125, 6, 32, Math.PI), mats.lash);
      lash.rotation.x = Math.PI / 2;
      lash.scale.set(1.2, 0.8, 1);
      lid.add(cap, lash);
      lid.rotation.x = -1.2;
      eyeG.add(lid);
      this.lids.push(lid);
      // lower lid
      const low = new THREE.Mesh(new THREE.SphereGeometry(0.0134, 24, 10, 0, Math.PI * 2, Math.PI * 0.6, Math.PI * 0.4), mats.skin);
      low.scale.set(1.2, 0.86, 0.78);
      eyeG.add(low);
      H.add(eyeG);
      // brow: tapered crescent; pivot at its inner end
      const browG = new THREE.Group();
      const by = 0.044, bx = 0.012;
      browG.position.set(sx * bx, by, surf(bx, by) + 0.0006);
      const brow = new THREE.Mesh(browGeometry(), mats.brow);
      brow.scale.x = sx; // mirror for the left side
      brow.rotation.y = sx * -0.42; // follow the forehead's curve
      browG.add(brow);
      browG.userData = { sx, base: browG.position.clone() };
      H.add(browG);
      this.brows.push(browG);
      // cheek (only shows when puffed)
      const cheek = new THREE.Mesh(new THREE.SphereGeometry(0.022, 18, 14), mats.skin);
      const cy = -0.035, cx = 0.04;
      cheek.position.set(sx * cx, cy, surf(cx, cy) - 0.03);
      cheek.userData = { sx, base: cheek.position.clone() };
      H.add(cheek);
      this.cheeks.push(cheek);
    }
    // mouth
    const mouthG = new THREE.Group();
    const my = -0.05;
    mouthG.position.set(0, my, surf(0, my) - 0.0042);
    H.add(mouthG);
    this.mouthG = mouthG;
    this.mouthInner = new THREE.Mesh(new THREE.SphereGeometry(0.012, 18, 12), mats.mouth);
    this.mouthInner.scale.set(1.5, 0.15, 0.5);
    mouthG.add(this.mouthInner);
    this.teeth = new THREE.Mesh(new THREE.CapsuleGeometry(0.0032, 0.022, 4, 8), mats.white);
    this.teeth.rotation.z = Math.PI / 2;
    this.teeth.position.set(0, 0.002, 0.001);
    mouthG.add(this.teeth);
    this.lipU = new THREE.Mesh(new THREE.BufferGeometry(), mats.lip);
    this.lipL = new THREE.Mesh(new THREE.BufferGeometry(), mats.lip);
    mouthG.add(this.lipU, this.lipL);

    if (style.headwear === "hijab") this.buildHijab();
    else {
      // short hair: a cap following the skull, lower at the back and sides
      const hg = new THREE.SphereGeometry(1, 64, 40, 0, Math.PI * 2, 0, Math.PI * 0.62);
      const hp = hg.attributes.position;
      for (let i = 0; i < hp.count; i++) {
        const x = hp.getX(i), y = hp.getY(i), z = hp.getZ(i);
        // hairline: rises at the forehead, drops behind the ears
        const frontness = Math.max(0, z);
        const yCut = 0.42 * frontness * frontness - 0.35 * Math.max(0, -z);
        const lift = y < yCut ? 1.012 : 1.06 + 0.025 * Math.max(0, y);
        hp.setXYZ(i, x * rx * lift, Math.max(y, yCut) * ry * lift, z * rz * lift);
      }
      hg.computeVertexNormals();
      const hair = new THREE.Mesh(hg, mats.hair);
      hair.position.set(0, 0.004, -0.002);
      hair.castShadow = true;
      H.add(hair);
      if (style.headwear === "kufi") {
        const kufi = new THREE.Mesh(new THREE.SphereGeometry(1, 56, 20, 0, Math.PI * 2, 0, Math.PI * 0.4), mats.hijab);
        kufi.scale.set(rx * 1.12, ry * 1.04, rz * 1.13);
        kufi.rotation.x = -0.32;
        kufi.position.y = 0.014;
        H.add(kufi);
        // embroidered band
        const rimR = Math.sin(Math.PI * 0.4), rimY = Math.cos(Math.PI * 0.4) * ry * 1.04;
        const band = new THREE.Mesh(new THREE.TorusGeometry(1, 0.022, 8, 72), mats.accent);
        band.rotation.x = Math.PI / 2 - 0.32;
        band.scale.set(rx * 1.13 * rimR, rz * 1.14 * rimR, 0.12);
        band.position.set(0, 0.014 + rimY * Math.cos(0.32), rimY * Math.sin(0.32));
        H.add(band);
      }
    }
    if (style.beard) {
      // full, short beard following the jaw, open around the mouth
      const bg = new THREE.SphereGeometry(1, 72, 36, Math.PI * 0.06, Math.PI * 0.88, Math.PI * 0.5, Math.PI * 0.44);
      const bp = bg.attributes.position;
      const drop: boolean[] = [];
      for (let i = 0; i < bp.count; i++) {
        const ux = bp.getX(i), uy = bp.getY(i), uz = bp.getZ(i);
        drop[i] = (Math.abs(ux) < 0.3 && uy > -0.6 && uy < -0.3 && uz > 0.7) || uy > -0.1 - 0.32 * uz * uz;
        const k = Math.min(1, Math.max(0, -uy));
        const X = ux * rx * (1 - 0.26 * k * k) * 1.035;
        const Y = uy * ry * 1.02;
        const Z = uz * rz * 1.035 + uz * faceRelief(ux, uy, uz) * 1.05;
        bp.setXYZ(i, X, Y - 0.002, Z + 0.002);
      }
      const bsrc = bg.index!.array;
      const bidx: number[] = [];
      for (let t = 0; t < bsrc.length; t += 3) if (!drop[bsrc[t]] && !drop[bsrc[t + 1]] && !drop[bsrc[t + 2]]) bidx.push(bsrc[t], bsrc[t + 1], bsrc[t + 2]);
      bg.setIndex(bidx);
      bg.computeVertexNormals();
      const beard = new THREE.Mesh(bg, new THREE.MeshStandardMaterial({ color: new THREE.Color(style.hair).lerp(new THREE.Color("#4a3a30"), 0.25), roughness: 0.95 }));
      H.add(beard);
      const mo = new THREE.Mesh(new THREE.CapsuleGeometry(0.0035, 0.026, 4, 10), mats.hair);
      mo.rotation.z = Math.PI / 2;
      mo.position.set(0, -0.041, surf(0, -0.041) + 0.001);
      H.add(mo);
    }
  }

  /** Hijab: a head wrap with an oval face opening, an under-scarf band and a folded drape over the shoulders. */
  private buildHijab() {
    const { mats } = this;
    const H = this.head;
    const { rx, ry, rz } = BODY.head;
    // face opening on the unit sphere: centre, half-width, half-height
    const oy = -0.12, ow = 0.64, oh = 0.8;
    const ovalD = (x: number, y: number, z: number) => (z <= 0.15 ? 9 : Math.hypot(x / ow, (y - oy) / oh));
    const g = new THREE.SphereGeometry(1, 120, 90);
    const p = g.attributes.position;
    const keep: boolean[] = [];
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
      const d = ovalD(x, y, z);
      keep[i] = d >= 0.985;
      // tuck the fabric in around the face; looser further back; close under the chin
      let s = 1.17;
      if (d < 1.5) s = 1.07 + 0.1 * Math.min(1, (d - 1) / 0.5);
      if (y < -0.55) s *= 1 - 0.14 * Math.min(1, (-y - 0.55) / 0.45);
      // soft volume at the crown and back
      s += 0.03 * Math.max(0, -z) * Math.max(0, y + 0.3);
      p.setXYZ(i, x * rx * s, y * ry * s, z * rz * s);
    }
    const src = g.index!.array;
    const idx: number[] = [];
    for (let t = 0; t < src.length; t += 3) {
      const a = src[t], b = src[t + 1], c = src[t + 2];
      if (keep[a] || keep[b] || keep[c]) idx.push(a, b, c);
    }
    g.setIndex(idx);
    g.computeVertexNormals();
    const shell = new THREE.Mesh(g, mats.hijab);
    shell.position.set(0, -0.006, -0.004);
    shell.castShadow = true;
    H.add(shell);

    // rolled edge around the opening, and the under-scarf band across the forehead
    const rim = (th0: number, th1: number, scale: number, r: number, mat: THREE.Material) => {
      const pts: THREE.Vector3[] = [];
      for (let k = 0; k <= 64; k++) {
        const th = th0 + ((th1 - th0) * k) / 64;
        const x = ow * Math.cos(th), y = oy + oh * Math.sin(th);
        const z = Math.sqrt(Math.max(0.02, 1 - x * x - y * y));
        let s = scale;
        if (y < -0.55) s *= 1 - 0.14 * Math.min(1, (-y - 0.55) / 0.45);
        pts.push(new THREE.Vector3(x * rx * s, y * ry * s, z * rz * s));
      }
      const m = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, th1 - th0 > 6), 128, r, 10, th1 - th0 > 6), mat);
      m.position.set(0, -0.006, -0.004);
      H.add(m);
    };
    rim(0, Math.PI * 2, 1.072, 0.0042, mats.hijab);
    rim(Math.PI * 0.18, Math.PI * 0.82, 1.045, 0.0036, mats.under);

    // neck wrap: fabric continues from under the chin down to the drape (torso space)
    const baseY = BODY.neckBase.y - BODY.hipY - 0.004, baseZ = -0.006;
    const wrap = new THREE.Mesh(
      lathe([[0.0, 0.16], [0.05, 0.158], [0.062, 0.12], [0.06, 0.085], [0.066, 0.06]], 72, { count: 7, amp: (y) => (y < 0.1 ? 0.0018 : 0) }),
      mats.hijab,
    );
    wrap.scale.set(1, 1, 0.9);
    wrap.position.set(0, baseY, baseZ);
    this.torso.add(wrap);
    // drape over shoulders and chest; hangs lower in front and back, lies on the chest
    const drapeProf: [number, number][] = [
      [0.066, 0.06], [0.085, 0.05], [0.11, 0.04], [0.14, 0.027], [0.168, 0.013], [0.196, -0.004], [0.215, -0.03], [0.226, -0.06], [0.228, -0.1], [0.226, -0.14],
    ];
    const drapeGeo = lathe(drapeProf, 144, { count: 8, amp: (y) => (y < -0.02 ? Math.min(1, (-y - 0.02) / 0.1) * 0.006 : 0), phase: 0.6 });
    const pa = drapeGeo.attributes.position;
    for (let i = 0; i < pa.count; i++) {
      const x = pa.getX(i);
      let y = pa.getY(i), z = pa.getZ(i) * 0.7;
      if (y < -0.02) {
        // rounded hem: falls further where the cloth is over the chest and back
        const front = Math.abs(z) / (Math.hypot(x, z * 1.3) || 1);
        y -= Math.pow(front, 1.6) * (-y - 0.02) * 1.25;
      }
      // lie on the chest so hands touching it stay in front of the fabric
      if (baseY + y < 0.42) {
        const limit = torsoFront(baseY + y) + 0.01 - baseZ;
        if (z > limit) z = limit + (z - limit) * 0.12;
      }
      pa.setXYZ(i, x, y, z);
    }
    drapeGeo.computeVertexNormals();
    const drape = new THREE.Mesh(drapeGeo, mats.hijab);
    drape.position.set(0, baseY, baseZ);
    drape.castShadow = true;
    this.torso.add(drape);
  }

  private applyFace(f: FaceState, time: number) {
    // brows: raise, knit (inner ends down and together), inner raise
    for (const b of this.brows) {
      const sx = b.userData.sx as number;
      const base = b.userData.base as THREE.Vector3;
      b.position.copy(base);
      b.position.y += f.browUp * 0.0085 - f.browDown * 0.005 + f.browInnerUp * 0.0028;
      b.position.x = base.x - sx * f.browDown * 0.003;
      b.rotation.z = sx * (-f.browDown * 0.3 + f.browInnerUp * 0.34 + f.browUp * 0.05);
    }
    // blink + lids
    const bt = (time + this.blinkPhase) % 3.9;
    const blink = bt < 0.16 ? Math.sin((bt / 0.16) * Math.PI) : 0;
    const close = Math.min(1, Math.max(f.eyesClosed, blink, f.squint * 0.5, f.browDown * 0.25)) - f.eyesWide * 0.35 - f.browUp * 0.15;
    for (const lid of this.lids) lid.rotation.x = -1.2 + Math.max(-0.4, close) * 1.32;
    // small involuntary eye movements keep the gaze alive
    if (time > this.saccade.next) {
      this.saccade.x = (Math.random() - 0.5) * 0.08;
      this.saccade.y = (Math.random() - 0.5) * 0.05;
      this.saccade.next = time + 0.8 + Math.random() * 2.2;
    }
    for (const ir of this.irises) {
      ir.rotation.y = (f.gazeX + this.saccade.x) * 0.45;
      ir.rotation.x = -(f.gazeY + this.saccade.y) * 0.35;
    }
    for (const c of this.cheeks) {
      const p = f.puff;
      const base = c.userData.base as THREE.Vector3;
      c.visible = p > 0.02;
      c.scale.setScalar(1 + p * 0.1);
      c.position.set(base.x * (1 + p * 0.06), base.y, base.z + p * 0.018);
    }
    // mouth (lip tubes rebuilt only when the shape changes)
    const open = Math.min(1, f.mouthOpen);
    const width = 0.0205 * (1 + f.smile * 0.16 - f.purse * 0.42);
    const corner = f.smile * 0.0045 - f.frown * 0.005;
    const fwd = f.purse * 0.007 + f.puff * 0.002;
    const gap = open * 0.013 * (1 - f.lipsPress);
    const press = f.lipsPress;
    const key = [width, corner, fwd, gap, press].map((v) => Math.round(v * 4000)).join(",");
    if (key !== this.lipKey) {
      this.lipKey = key;
      const mk = (upper: boolean) => {
        const pts: THREE.Vector3[] = [];
        for (let i = 0; i <= 10; i++) {
          const u = (i / 10) * 2 - 1;
          const curve = 1 - u * u;
          // cupid's bow on the upper lip
          const bow = upper ? 0.0007 * Math.exp(-((Math.abs(u) - 0.28) ** 2) / 0.02) : 0;
          const z = curve * (0.0042 + fwd) - 0.0012 * (1 - curve);
          const y = upper
            ? 0.0026 + curve * gap * 0.3 + (1 - curve) * corner + curve * 0.0006 + bow
            : -0.003 - curve * gap + (1 - curve) * corner - curve * 0.0008;
          pts.push(new THREE.Vector3(u * width, y, z));
        }
        const r = (upper ? 0.0036 : 0.0046) * (1 - press * 0.45);
        return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 28, r, 10, false);
      };
      this.lipU.geometry.dispose();
      this.lipL.geometry.dispose();
      this.lipU.geometry = mk(true);
      this.lipL.geometry = mk(false);
    }
    this.mouthInner.scale.set(1.45 * (width / 0.0205) * 1.2, 0.12 + open * 0.95, 0.5);
    this.mouthInner.position.y = -gap * 0.42;
    this.teeth.visible = f.teeth > 0.2 || open > 0.3;
    this.teeth.scale.set(1, width / 0.0205, 1);
  }

  /** Apply a sampled pose. `time` is wall-clock seconds for idle motion. */
  apply(p: Pose, time: number) {
    const f = p.face;
    // torso & head, with breathing and a slow weight shift
    const breath = Math.sin(time * 1.6) * 0.004;
    const sway = Math.sin(time * 0.31) * 0.006;
    this.torso.rotation.set(f.torsoPitch + breath * 0.5, f.torsoYaw + sway * 0.5, f.torsoRoll + sway * 0.4);
    const nod = f.nod ? Math.sin(time * Math.PI * 2 * 2.2) * f.nod : 0;
    const shake = f.shake ? Math.sin(time * Math.PI * 2 * 2.6) * f.shake : 0;
    this.headPivot.rotation.set(f.headPitch + nod + Math.sin(time * 0.7) * 0.012, f.headYaw + shake + Math.sin(time * 0.43) * 0.015, f.headRoll);
    this.applyFace(f, time);

    for (const s of ["R", "L"] as HandSide[]) {
      const hp = p[s];
      const sx = s === "R" ? -1 : 1;
      const S = v3.set(sx * BODY.shoulder.x, BODY.shoulder.y + breath, BODY.shoulder.z).clone();
      const W = v4.copy(hp.pos).clone();
      // elbow pole: down, out and a little back; flares out for high hands
      const high = Math.max(0, W.y - 1.35);
      // Hands crossing the midline pull the elbow forward rather than out.
      const cross = Math.max(0, -sx * W.x) * 1.2;
      // Raised hands (face signs) keep the elbow low and in front of the body.
      const face = Math.min(1, high / 0.25);
      const pole = new THREE.Vector3(
        S.x + sx * (0.22 - face * 0.1 - cross * 0.5),
        S.y - 0.55 - face * 0.15,
        S.z - 0.2 + face * 0.45 + cross * 0.3 + Math.max(0, W.z - 0.25) * 0.25,
      );
      const E = solveElbow(S, W, pole, BODY.upperArm, BODY.forearm, new THREE.Vector3());
      // sleeve ends a little before the wrist; bare wrist bridges to the hand
      const fdir = new THREE.Vector3().subVectors(W, E).normalize();
      const cuff = new THREE.Vector3().copy(W).addScaledVector(fdir, -0.03);
      this.sleeves[s].update(S, E, cuff, 0.05, 0.041, 0.034);
      const wr = this.wrists[s];
      wr.position.copy(cuff).addScaledVector(fdir, -0.01);
      wr.quaternion.setFromUnitVectors(UP, fdir);
      wr.scale.set(1, 0.045, 1);
      const hand = this.hands[s];
      hand.root.position.copy(W);
      hand.root.quaternion.copy(hp.quat);
      hand.setShape(hp.shape);
    }
  }

  dispose() {
    this.group.traverse((o) => {
      if ((o as THREE.Mesh).geometry) (o as THREE.Mesh).geometry.dispose();
    });
    Object.values(this.mats).forEach((m) => m.dispose());
  }
}

export { qTmp };
