import * as THREE from "three";
import { BODY } from "../asl/body";
import { buildHandRig, type HandRig } from "./handRig";
import type { Pose } from "../asl/timeline";
import type { FaceState, HandSide } from "../asl/types";

export interface AvatarStyle {
  skin: string;
  top: string;
  accent: string;
  headwear: "hijab" | "kufi" | "none";
  hijab: string;
  beard: boolean;
  hair: string;
  flat?: boolean; // 2D / flat shaded look
}

export const AVATAR_PRESETS: Record<string, AvatarStyle> = {
  amina: { skin: "#c58c67", top: "#1d3b4f", accent: "#d9b36c", headwear: "hijab", hijab: "#3d4f5f", beard: false, hair: "#2a1d17" },
  yusuf: { skin: "#a8724f", top: "#22313f", accent: "#c9a25a", headwear: "kufi", hijab: "#f1ede4", beard: true, hair: "#1f1712" },
  sam: { skin: "#e0b493", top: "#2b2f3a", accent: "#6aa6d9", headwear: "none", hijab: "#333", beard: false, hair: "#3b2a1f" },
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

function limb(len: number, r0: number, r1: number, mat: THREE.Material) {
  // tapered capsule: cylinder + end spheres, pointing along +Y from origin
  const g = new THREE.Group();
  const cyl = new THREE.Mesh(new THREE.CylinderGeometry(r1, r0, 1, 18, 1, true), mat);
  cyl.position.y = 0.5;
  cyl.castShadow = true;
  const holder = new THREE.Group();
  holder.add(cyl);
  holder.scale.y = len;
  g.add(holder);
  const s0 = new THREE.Mesh(new THREE.SphereGeometry(r0, 18, 12), mat);
  s0.castShadow = true;
  g.add(s0);
  return g;
}

export class AvatarRig {
  group = new THREE.Group();
  torso = new THREE.Group();
  headPivot = new THREE.Group();
  head = new THREE.Group();
  hands: Record<HandSide, HandRig>;
  private upper: Record<HandSide, THREE.Group>;
  private fore: Record<HandSide, THREE.Group>;
  private elbowBall: Record<HandSide, THREE.Mesh>;
  private mats: Record<string, THREE.MeshStandardMaterial> = {};
  private brows: THREE.Mesh[] = [];
  private lids: THREE.Mesh[] = [];
  private irises: THREE.Object3D[] = [];
  private cheeks: THREE.Mesh[] = [];
  private lipU!: THREE.Mesh;
  private lipL!: THREE.Mesh;
  private mouthInner!: THREE.Mesh;
  private teeth!: THREE.Mesh;
  private blinkPhase = Math.random() * 3;
  style: AvatarStyle;

  constructor(style: AvatarStyle = AVATAR_PRESETS.amina) {
    this.style = style;
    const M = (c: string, rough = 0.62, extra: Partial<THREE.MeshStandardMaterialParameters> = {}) =>
      new THREE.MeshStandardMaterial({ color: c, roughness: rough, metalness: 0, flatShading: false, ...extra });
    this.mats = {
      skin: M(style.skin, 0.55),
      top: M(style.top, 0.85),
      accent: M(style.accent, 0.5),
      dark: M("#141010", 0.4),
      white: M("#f6f3ee", 0.3),
      iris: M("#3a2618", 0.3),
      lip: M(new THREE.Color(style.skin).lerp(new THREE.Color("#9c4a45"), 0.45).multiplyScalar(0.85).getStyle(), 0.4),
      mouth: M("#3a1512", 0.8),
      hijab: M(style.hijab, 0.9),
      hair: M(style.hair, 0.8),
      nail: M(new THREE.Color(style.skin).lerp(new THREE.Color("#ffe9e0"), 0.45).getStyle(), 0.35),
      brow: M(style.hair, 0.9),
      lower: M(new THREE.Color(style.top).multiplyScalar(0.8).getStyle(), 0.9),
    };
    this.group.add(this.torso);
    this.torso.position.y = BODY.hipY;
    this.buildBody();
    this.buildHead();
    this.hands = {
      R: buildHandRig("R", { skin: this.mats.skin, nail: this.mats.nail }),
      L: buildHandRig("L", { skin: this.mats.skin, nail: this.mats.nail }),
    };
    this.upper = { R: limb(BODY.upperArm, 0.042, 0.037, this.mats.top), L: limb(BODY.upperArm, 0.042, 0.037, this.mats.top) };
    this.fore = { R: limb(BODY.forearm, 0.036, 0.029, this.mats.top), L: limb(BODY.forearm, 0.036, 0.029, this.mats.top) };
    this.elbowBall = { R: new THREE.Mesh(new THREE.SphereGeometry(0.037, 16, 12), this.mats.top), L: new THREE.Mesh(new THREE.SphereGeometry(0.037, 16, 12), this.mats.top) };
    for (const s of ["R", "L"] as HandSide[]) {
      // arms & hands live in torso space but the torso group is offset by hipY,
      // so we add them to an "arms" frame that cancels that offset.
      this.armsFrame.add(this.upper[s], this.fore[s], this.elbowBall[s], this.hands[s].root);
      // cuff
      const cuff = new THREE.Mesh(new THREE.TorusGeometry(0.029, 0.005, 8, 20), this.mats.accent);
      cuff.rotation.x = Math.PI / 2;
      cuff.position.y = BODY.forearm - 0.004;
      this.fore[s].add(cuff);
    }
  }

  armsFrame = new THREE.Group();

  private buildBody() {
    const { mats } = this;
    const T = this.torso;
    this.armsFrame.position.y = -BODY.hipY;
    T.add(this.armsFrame);
    // Torso via lathe profile (radius, height above hips)
    const prof: [number, number][] = [
      [0.0, -0.02], [0.155, -0.02], [0.165, 0.06], [0.152, 0.18], [0.158, 0.3], [0.172, 0.37], [0.18, 0.42], [0.165, 0.455], [0.12, 0.475], [0.06, 0.485], [0.0, 0.49],
    ];
    const lathe = new THREE.LatheGeometry(prof.map(([r, y]) => new THREE.Vector2(r, y)), 40);
    const torsoMesh = new THREE.Mesh(lathe, mats.top);
    torsoMesh.scale.set(1, 1, 0.62);
    torsoMesh.position.z = 0.0;
    torsoMesh.castShadow = torsoMesh.receiveShadow = true;
    T.add(torsoMesh);
    // shoulders
    for (const sx of [-1, 1]) {
      const sh = new THREE.Mesh(new THREE.SphereGeometry(0.046, 20, 14), mats.top);
      sh.position.set(sx * (BODY.shoulder.x - 0.01), BODY.shoulder.y - BODY.hipY - 0.004, BODY.shoulder.z);
      sh.scale.set(1, 0.9, 0.95);
      sh.castShadow = true;
      T.add(sh);
    }
    // collar / neckline trim
    const collar = new THREE.Mesh(new THREE.TorusGeometry(0.058, 0.008, 8, 32), mats.accent);
    collar.rotation.x = Math.PI / 2 + 0.25;
    collar.scale.set(1, 0.85, 1);
    collar.position.set(0, BODY.neckBase.y - BODY.hipY + 0.005, 0.012);
    T.add(collar);
    // neck
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.043, 0.05, 0.11, 20), mats.skin);
    neck.position.set(0, BODY.neckBase.y - BODY.hipY + 0.04, 0.0);
    T.add(neck);
    // lower body: long garment
    const robeProf: [number, number][] = [[0, 0.0], [0.16, 0.0], [0.19, -0.3], [0.22, -0.62], [0.235, -0.9], [0.0, -0.9]];
    const robe = new THREE.Mesh(new THREE.LatheGeometry(robeProf.map(([r, y]) => new THREE.Vector2(r, y)), 40), mats.lower);
    robe.scale.set(1, 1, 0.7);
    robe.receiveShadow = true;
    T.add(robe);
    for (const sx of [-1, 1]) {
      const foot = new THREE.Mesh(new THREE.SphereGeometry(0.05, 14, 10), mats.dark);
      foot.scale.set(0.9, 0.45, 1.9);
      foot.position.set(sx * 0.09, -0.955, 0.06);
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
    /** z of the head ellipsoid surface at (x, y) — used to seat facial features. */
    const surf = (x: number, y: number, inset = 0) => rz * Math.sqrt(Math.max(0, 1 - (x / rx) ** 2 - (y / ry) ** 2)) - inset;
    const skull = new THREE.Mesh(new THREE.SphereGeometry(1, 48, 36), mats.skin);
    skull.scale.set(rx, ry, rz);
    skull.castShadow = true;
    H.add(skull);
    // jaw / chin volume
    const jaw = new THREE.Mesh(new THREE.SphereGeometry(1, 36, 24), mats.skin);
    jaw.scale.set(rx * 0.74, ry * 0.46, rz * 0.8);
    jaw.position.set(0, -ry * 0.5, rz * 0.12);
    H.add(jaw);
    // nose
    const nose = new THREE.Mesh(new THREE.SphereGeometry(0.0105, 18, 14), mats.skin);
    nose.scale.set(1.15, 1.05, 0.95);
    nose.position.set(0, -0.012, surf(0, -0.012) - 0.0015);
    H.add(nose);
    const bridge = new THREE.Mesh(new THREE.CapsuleGeometry(0.0052, 0.022, 4, 10), mats.skin);
    bridge.position.set(0, 0.006, surf(0, 0.006) - 0.0035);
    bridge.rotation.x = -0.25;
    H.add(bridge);
    // ears
    for (const sx of [-1, 1]) {
      const ear = new THREE.Mesh(new THREE.SphereGeometry(0.017, 12, 10), mats.skin);
      ear.scale.set(0.45, 1.35, 0.9);
      ear.position.set(sx * rx * 0.98, 0.002, -0.006);
      H.add(ear);
    }
    // eyes
    const eyeY = 0.02, eyeX = 0.031;
    for (const sx of [-1, 1]) {
      const eyeG = new THREE.Group();
      eyeG.position.set(sx * eyeX, eyeY, surf(eyeX, eyeY) - 0.007);
      eyeG.rotation.y = sx * 0.22;
      const white = new THREE.Mesh(new THREE.SphereGeometry(0.0128, 22, 16), mats.white);
      white.scale.set(1.18, 0.82, 0.75);
      eyeG.add(white);
      const irisG = new THREE.Object3D();
      const iris = new THREE.Mesh(new THREE.SphereGeometry(0.0074, 18, 14), mats.iris);
      iris.position.z = 0.0068;
      iris.scale.set(1, 1, 0.55);
      const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.0036, 12, 10), mats.dark);
      pupil.position.z = 0.0099;
      pupil.scale.set(1, 1, 0.45);
      const glint = new THREE.Mesh(new THREE.SphereGeometry(0.0013, 8, 6), mats.white);
      glint.position.set(0.002, 0.0022, 0.0108);
      irisG.add(iris, pupil, glint);
      eyeG.add(irisG);
      this.irises.push(irisG);
      // upper lid: skin cap that rotates down to close; lash line on its edge
      const lid = new THREE.Group();
      const cap = new THREE.Mesh(new THREE.SphereGeometry(0.0138, 22, 10, 0, Math.PI * 2, 0, Math.PI / 2), mats.skin);
      cap.scale.set(1.2, 0.9, 0.82);
      const lash = new THREE.Mesh(new THREE.TorusGeometry(0.0138, 0.0011, 6, 24, Math.PI), mats.dark);
      lash.rotation.x = Math.PI / 2;
      lash.scale.set(1.2, 0.82, 1);
      lid.add(cap, lash);
      lid.rotation.x = -1.2;
      eyeG.add(lid);
      this.lids.push(lid as unknown as THREE.Mesh);
      // lower lid hint
      const low = new THREE.Mesh(new THREE.SphereGeometry(0.0136, 18, 8, 0, Math.PI * 2, Math.PI * 0.62, Math.PI * 0.38), mats.skin);
      low.scale.set(1.2, 0.86, 0.8);
      eyeG.add(low);
      H.add(eyeG);
      // brow
      const brow = new THREE.Mesh(new THREE.CapsuleGeometry(0.0043, 0.027, 4, 10), mats.brow);
      brow.rotation.z = Math.PI / 2;
      const by = 0.045;
      brow.position.set(sx * 0.032, by, surf(0.032, by) + 0.0015);
      brow.rotation.y = sx * 0.3;
      brow.userData = { sx, base: brow.position.clone() };
      H.add(brow);
      this.brows.push(brow);
      // cheek (only shows when puffed)
      const cheek = new THREE.Mesh(new THREE.SphereGeometry(0.022, 16, 12), mats.skin);
      const cy = -0.035, cx = 0.04;
      cheek.position.set(sx * cx, cy, surf(cx, cy) - 0.03);
      cheek.userData = { sx, base: cheek.position.clone() };
      H.add(cheek);
      this.cheeks.push(cheek);
    }
    // mouth
    const mouthG = new THREE.Group();
    const my = -0.05;
    mouthG.position.set(0, my, surf(0, my) - 0.004);
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

    // headwear
    if (style.headwear === "hijab") {
      // shell around the head with an oval opening for the face
      const open = 0.95;
      const shell = new THREE.Mesh(
        new THREE.SphereGeometry(1, 48, 36, Math.PI / 2 + open, Math.PI * 2 - open * 2, 0, Math.PI),
        new THREE.MeshStandardMaterial({ color: style.hijab, roughness: 0.9, side: THREE.DoubleSide }),
      );
      shell.scale.set(rx * 1.2, ry * 1.2, rz * 1.18);
      shell.position.set(0, -0.012, -0.006);
      H.add(shell);
      // band over the forehead closing the top of the opening
      const band = new THREE.Mesh(new THREE.SphereGeometry(1, 40, 20, 0, Math.PI * 2, 0, Math.PI * 0.3), mats.hijab);
      band.scale.set(rx * 1.13, ry * 1.08, rz * 1.12);
      band.rotation.x = -0.45;
      band.position.set(0, 0.0, -0.002);
      H.add(band);
      // under-chin wrap
      const chinWrap = new THREE.Mesh(new THREE.SphereGeometry(1, 36, 18, 0, Math.PI * 2, Math.PI * 0.7, Math.PI * 0.3), mats.hijab);
      chinWrap.scale.set(rx * 1.02, ry * 0.95, rz * 1.02);
      chinWrap.position.set(0, -0.05, -0.004);
      H.add(chinWrap);
      // drape over neck & shoulders (torso space)
      const drapeProf: [number, number][] = [[0.0, 0.16], [0.07, 0.15], [0.085, 0.09], [0.1, 0.03], [0.15, -0.04], [0.2, -0.1], [0.203, -0.125]];
      const drape = new THREE.Mesh(
        new THREE.LatheGeometry(drapeProf.map(([r, y]) => new THREE.Vector2(r, y)), 48),
        new THREE.MeshStandardMaterial({ color: style.hijab, roughness: 0.9, side: THREE.DoubleSide }),
      );
      drape.scale.set(1, 1, 0.74);
      drape.position.set(0, BODY.neckBase.y - BODY.hipY - 0.005, -0.006);
      drape.castShadow = true;
      this.torso.add(drape);
    } else {
      const hair = new THREE.Mesh(new THREE.SphereGeometry(1, 40, 24, 0, Math.PI * 2, 0, Math.PI * 0.52), mats.hair);
      hair.scale.set(rx * 1.05, ry * 1.03, rz * 1.06);
      hair.rotation.x = -0.58;
      hair.position.y = 0.006;
      H.add(hair);
      if (style.headwear === "kufi") {
        const kufi = new THREE.Mesh(new THREE.SphereGeometry(1, 36, 16, 0, Math.PI * 2, 0, Math.PI * 0.36), mats.hijab);
        kufi.scale.set(rx * 1.1, ry * 1.05, rz * 1.1);
        kufi.rotation.x = -0.3;
        kufi.position.y = 0.012;
        H.add(kufi);
      }
    }
    if (style.beard) {
      const beard = new THREE.Mesh(new THREE.SphereGeometry(1, 36, 20, Math.PI * 0.12, Math.PI * 1.76, Math.PI * 0.62, Math.PI * 0.34), mats.hair);
      beard.rotation.y = Math.PI / 2 + Math.PI;
      beard.scale.set(rx * 0.92, ry * 0.9, rz * 0.98);
      beard.position.set(0, -0.012, 0.004);
      H.add(beard);
      const jawBeard = new THREE.Mesh(new THREE.SphereGeometry(1, 30, 16), mats.hair);
      jawBeard.scale.set(rx * 0.7, ry * 0.4, rz * 0.78);
      jawBeard.position.set(0, -ry * 0.6, rz * 0.12);
      H.add(jawBeard);
    }
  }

  private mouthG!: THREE.Group;
  private lipKey = "";

  private applyFace(f: FaceState, time: number) {
    // brows
    for (const b of this.brows) {
      const sx = b.userData.sx as number;
      const base = b.userData.base as THREE.Vector3;
      b.position.copy(base);
      b.position.y += f.browUp * 0.009 - f.browDown * 0.0055 + f.browInnerUp * 0.003;
      b.position.x = base.x - sx * f.browDown * 0.0035;
      b.rotation.z = Math.PI / 2 + sx * (f.browDown * 0.34 - f.browInnerUp * 0.38 - f.browUp * 0.06);
    }
    // blink + lids
    const bt = (time + this.blinkPhase) % 3.7;
    const blink = bt < 0.15 ? Math.sin((bt / 0.15) * Math.PI) : 0;
    const close = Math.min(1, Math.max(f.eyesClosed, blink, f.squint * 0.5, f.browDown * 0.25)) - f.eyesWide * 0.35 - f.browUp * 0.15;
    for (const lid of this.lids) lid.rotation.x = -1.2 + Math.max(-0.4, close) * 1.32;
    for (const ir of this.irises) {
      ir.rotation.y = f.gazeX * 0.45;
      ir.rotation.x = -f.gazeY * 0.35;
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
        for (let i = 0; i <= 8; i++) {
          const u = (i / 8) * 2 - 1;
          const curve = 1 - u * u;
          const z = curve * (0.0042 + fwd) - 0.0012 * (1 - curve);
          const y = upper
            ? 0.0026 + curve * gap * 0.3 + (1 - curve) * corner + curve * 0.0008
            : -0.003 - curve * gap + (1 - curve) * corner - curve * 0.0006;
          pts.push(new THREE.Vector3(u * width, y, z));
        }
        const r = (upper ? 0.0033 : 0.0042) * (1 - press * 0.45);
        return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 24, r, 8, false);
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
    // torso & head
    const breath = Math.sin(time * 1.6) * 0.004;
    this.torso.rotation.set(f.torsoPitch + breath * 0.5, f.torsoYaw, f.torsoRoll);
    const nod = f.nod ? Math.sin(time * Math.PI * 2 * 2.2) * f.nod : 0;
    const shake = f.shake ? Math.sin(time * Math.PI * 2 * 2.6) * f.shake : 0;
    this.headPivot.rotation.set(f.headPitch + nod + Math.sin(time * 0.7) * 0.012, f.headYaw + shake + Math.sin(time * 0.43) * 0.015, f.headRoll);
    this.applyFace(f, time);

    for (const s of ["R", "L"] as HandSide[]) {
      const hp = p[s];
      const sx = s === "R" ? -1 : 1;
      const S = v3.set(sx * BODY.shoulder.x, BODY.shoulder.y + breath, BODY.shoulder.z);
      const W = v4.copy(hp.pos);
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
      const up = this.upper[s];
      up.position.copy(S);
      up.quaternion.setFromUnitVectors(UP, v1.subVectors(E, S).normalize());
      const fo = this.fore[s];
      fo.position.copy(E);
      // Forearm points at the wrist; roll it so the cuff seam follows the hand.
      fo.quaternion.setFromUnitVectors(UP, v1.subVectors(W, E).normalize());
      this.elbowBall[s].position.copy(E);
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
