import * as THREE from "three";
import type { Handshape, HandPoint, HandSide } from "../asl/types";

// Hand-local frame: origin at the wrist, +Y = finger direction, +Z = palm normal.
// Right hand: thumb on +X. Left hand: mirrored (thumb on -X). X = Y × Z for both,
// so a single orientation quaternion means the same thing for either hand.

const D2R = Math.PI / 180;

export const HAND_DIMS = {
  palmLen: 0.085,
  palmWidth: 0.078,
  palmThick: 0.026,
  fingers: {
    i: { x: 0.027, y: 0.085, len: [0.041, 0.025, 0.02], r: 0.0085 },
    m: { x: 0.008, y: 0.088, len: [0.045, 0.028, 0.021], r: 0.0088 },
    r: { x: -0.011, y: 0.085, len: [0.042, 0.026, 0.02], r: 0.0083 },
    p: { x: -0.028, y: 0.078, len: [0.033, 0.02, 0.018], r: 0.0074 },
  },
  thumb: { base: [0.033, 0.016, 0.01] as const, len: [0.036, 0.03, 0.025], r: 0.0102 },
};

type FingerKey = "i" | "m" | "r" | "p";

export interface HandRig {
  side: HandSide;
  root: THREE.Group;
  setShape(h: Handshape): void;
  /** Hand-local position of a reference point for the CURRENT shape. */
  point(p: HandPoint, out?: THREE.Vector3): THREE.Vector3;
  joints: { mcp: THREE.Object3D; pip: THREE.Object3D; dip: THREE.Object3D; tip: THREE.Object3D }[];
}

export interface RigMaterials { skin: THREE.Material; nail?: THREE.Material }

function capsule(len: number, r: number, mat: THREE.Material) {
  const g = new THREE.CapsuleGeometry(r, Math.max(0.001, len - r * 0.6), 6, 12);
  g.translate(0, len / 2, 0);
  const m = new THREE.Mesh(g, mat);
  m.castShadow = true;
  return m;
}

export function buildHandRig(side: HandSide, mats?: RigMaterials): HandRig {
  const s = side === "R" ? 1 : -1;
  const root = new THREE.Group();
  root.name = `hand-${side}`;
  const D = HAND_DIMS;

  if (mats) {
    // Palm: a rounded slab, slightly tapered toward the wrist.
    const palmShape = new THREE.Shape();
    const w = D.palmWidth / 2, l = D.palmLen;
    palmShape.moveTo(-w * 0.78, 0);
    palmShape.lineTo(w * 0.8, 0);
    palmShape.quadraticCurveTo(w * 1.05, l * 0.45, w * 0.95, l * 1.0);
    palmShape.lineTo(-w * 0.95, l * 0.94);
    palmShape.quadraticCurveTo(-w * 1.05, l * 0.45, -w * 0.78, 0);
    const pg = new THREE.ExtrudeGeometry(palmShape, {
      depth: D.palmThick - 0.016,
      bevelEnabled: true,
      bevelThickness: 0.008,
      bevelSize: 0.0065,
      bevelSegments: 4,
      curveSegments: 8,
    });
    pg.translate(0, 0, -(D.palmThick - 0.016) / 2);
    if (s < 0) pg.scale(-1, 1, 1);
    pg.computeVertexNormals();
    const palm = new THREE.Mesh(pg, mats.skin);
    palm.castShadow = true;
    root.add(palm);
    // Wrist ball
    const wrist = new THREE.Mesh(new THREE.SphereGeometry(0.024, 16, 12), mats.skin);
    wrist.scale.set(1.25, 0.8, 0.7);
    wrist.position.set(0, 0.004, 0);
    root.add(wrist);
    // Thenar (thumb muscle) pad
    const thenar = new THREE.Mesh(new THREE.SphereGeometry(0.02, 14, 10), mats.skin);
    thenar.scale.set(0.9, 1.4, 0.75);
    thenar.position.set(s * 0.018, 0.03, 0.007);
    root.add(thenar);
  }

  const joints: HandRig["joints"] = [];
  const fingerNodes: Record<FingerKey, { mcp: THREE.Object3D; pip: THREE.Object3D; dip: THREE.Object3D; tip: THREE.Object3D }> = {} as never;

  (Object.keys(D.fingers) as FingerKey[]).forEach((k) => {
    const f = D.fingers[k];
    const mcp = new THREE.Object3D();
    mcp.position.set(s * f.x, f.y, 0);
    const pip = new THREE.Object3D();
    pip.position.set(0, f.len[0], 0);
    const dip = new THREE.Object3D();
    dip.position.set(0, f.len[1], 0);
    const tip = new THREE.Object3D();
    tip.position.set(0, f.len[2], 0);
    mcp.add(pip);
    pip.add(dip);
    dip.add(tip);
    root.add(mcp);
    if (mats) {
      mcp.add(capsule(f.len[0], f.r, mats.skin));
      pip.add(capsule(f.len[1], f.r * 0.93, mats.skin));
      dip.add(capsule(f.len[2], f.r * 0.86, mats.skin));
      if (mats.nail) {
        const nail = new THREE.Mesh(new THREE.SphereGeometry(f.r * 0.75, 10, 6), mats.nail);
        nail.scale.set(0.95, 1.2, 0.35);
        nail.position.set(0, f.len[2] - f.r * 0.9, -f.r * 0.62);
        dip.add(nail);
      }
    }
    fingerNodes[k] = { mcp, pip, dip, tip };
    joints.push(fingerNodes[k]);
  });

  // Thumb: CMC node oriented from (radial abd, palmar abd, roll); MCP/IP flex about local X.
  const cmc = new THREE.Object3D();
  cmc.position.set(s * D.thumb.base[0], D.thumb.base[1], D.thumb.base[2]);
  const tmcp = new THREE.Object3D();
  tmcp.position.set(0, D.thumb.len[0], 0);
  const tip_ = new THREE.Object3D();
  tip_.position.set(0, D.thumb.len[1], 0);
  const ttip = new THREE.Object3D();
  ttip.position.set(0, D.thumb.len[2], 0);
  cmc.add(tmcp);
  tmcp.add(tip_);
  tip_.add(ttip);
  root.add(cmc);
  if (mats) {
    cmc.add(capsule(D.thumb.len[0], D.thumb.r * 1.15, mats.skin));
    tmcp.add(capsule(D.thumb.len[1], D.thumb.r, mats.skin));
    tip_.add(capsule(D.thumb.len[2], D.thumb.r * 0.92, mats.skin));
    if (mats.nail) {
      const nail = new THREE.Mesh(new THREE.SphereGeometry(D.thumb.r * 0.72, 10, 6), mats.nail);
      nail.scale.set(0.95, 1.2, 0.35);
      nail.position.set(0, D.thumb.len[2] - D.thumb.r * 0.95, -D.thumb.r * 0.62);
      tip_.add(nail);
    }
  }
  joints.push({ mcp: cmc, pip: tmcp, dip: tip_, tip: ttip });

  // Reference markers
  const markers: Partial<Record<HandPoint, THREE.Object3D>> = {};
  const mark = (p: HandPoint, parent: THREE.Object3D, x: number, y: number, z: number) => {
    const o = new THREE.Object3D();
    o.position.set(x, y, z);
    parent.add(o);
    markers[p] = o;
  };
  mark("palm", root, s * 0.002, D.palmLen * 0.55, D.palmThick / 2 + 0.004);
  mark("back", root, 0, D.palmLen * 0.55, -D.palmThick / 2 - 0.004);
  mark("wrist", root, 0, 0, 0);
  mark("heel", root, 0, 0.012, D.palmThick / 2 + 0.003);
  mark("knuckles", root, s * 0.004, D.palmLen + 0.004, -0.004);
  mark("radial", root, s * (D.palmWidth / 2 + 0.006), D.palmLen * 0.6, 0);
  mark("ulnar", root, -s * (D.palmWidth / 2 + 0.006), D.palmLen * 0.55, 0);
  mark("tipI", fingerNodes.i.tip, 0, 0.004, 0);
  mark("tipM", fingerNodes.m.tip, 0, 0.004, 0);
  mark("tipR", fingerNodes.r.tip, 0, 0.004, 0);
  mark("tipP", fingerNodes.p.tip, 0, 0.004, 0);
  mark("tipT", ttip, 0, 0.004, 0);
  mark("pipI", fingerNodes.i.pip, 0, 0, -0.006);
  mark("pipM", fingerNodes.m.pip, 0, 0, -0.006);

  const tmpY = new THREE.Vector3();
  const tmpZ = new THREE.Vector3();
  const tmpX = new THREE.Vector3();
  const tmpM = new THREE.Matrix4();
  const rollQ = new THREE.Quaternion();
  const AX = new THREE.Vector3(1, 0, 0);

  function setShape(h: Handshape) {
    (Object.keys(fingerNodes) as FingerKey[]).forEach((k) => {
      const [mcpF, pipF, dipF, spread] = h[k];
      const n = fingerNodes[k];
      // Spread: rotate about palm normal (Z). Index spreads toward thumb side.
      const dir = k === "i" ? 1 : k === "m" ? 0.15 : -1;
      n.mcp.rotation.set(mcpF * D2R, 0, -dir * s * spread * D2R, "ZXY");
      n.pip.rotation.set(pipF * D2R, 0, 0);
      n.dip.rotation.set(dipF * D2R, 0, 0);
    });
    const [a, b, roll, m, ip] = h.t;
    const ar = a * D2R, br = b * D2R;
    tmpY.set(s * Math.sin(ar) * Math.cos(br), Math.cos(ar) * Math.cos(br), Math.sin(br)).normalize();
    // Thumb flexes across the palm toward the little-finger side.
    tmpZ.set(-s, 0.25, 0.35).normalize();
    tmpZ.addScaledVector(tmpY, -tmpZ.dot(tmpY)).normalize();
    tmpX.crossVectors(tmpY, tmpZ);
    tmpM.makeBasis(tmpX, tmpY, tmpZ);
    cmc.quaternion.setFromRotationMatrix(tmpM);
    if (roll) cmc.quaternion.multiply(rollQ.setFromAxisAngle(tmpY.set(0, 1, 0), s * roll * D2R));
    tmcp.quaternion.setFromAxisAngle(AX, m * D2R);
    tip_.quaternion.setFromAxisAngle(AX, ip * D2R);
  }

  const inv = new THREE.Matrix4();
  function point(p: HandPoint, out = new THREE.Vector3()) {
    const mk = markers[p] ?? markers.palm!;
    root.updateMatrixWorld(true);
    inv.copy(root.matrixWorld).invert();
    return mk.getWorldPosition(out).applyMatrix4(inv);
  }

  return { side, root, setShape, point, joints };
}
