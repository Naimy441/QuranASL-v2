import * as THREE from "three";

// Elbow swivel: the rotation of the elbow about the shoulder→wrist axis, measured
// from "elbow hanging straight down" (radians). With the shoulder and wrist fixed,
// it is the one free parameter of the arm, and the one that makes an arm look
// human or robotic. Captured clips carry the signer's own swivel per frame.

const _g = new THREE.Vector3(), _e = new THREE.Vector3(), _a = new THREE.Vector3(), _c = new THREE.Vector3();

/** Unit vector "down" projected perpendicular to axis a (falls back to -z for vertical arms). */
function downRef(a: THREE.Vector3, out: THREE.Vector3) {
  out.set(0, -1, 0).addScaledVector(a, a.y);
  if (out.lengthSq() < 1e-6) out.set(0, 0, -1).addScaledVector(a, a.z);
  return out.normalize();
}

export function elbowSwivel(S: THREE.Vector3, E: THREE.Vector3, W: THREE.Vector3): number {
  const a = _a.subVectors(W, S).normalize();
  const g = downRef(a, _g);
  const e = _e.subVectors(E, S);
  e.addScaledVector(a, -e.dot(a));
  if (e.lengthSq() < 1e-8) return 0;
  e.normalize();
  return Math.atan2(_c.crossVectors(g, e).dot(a), g.dot(e));
}

/** Direction from the shoulder→wrist axis toward the elbow for a swivel angle. */
export function swivelDir(S: THREE.Vector3, W: THREE.Vector3, phi: number, out: THREE.Vector3): THREE.Vector3 {
  const a = _a.subVectors(W, S).normalize();
  const g = downRef(a, _g);
  return out.copy(g).multiplyScalar(Math.cos(phi)).addScaledVector(_c.crossVectors(a, g), Math.sin(phi));
}

/** Shortest signed difference b - a between two angles. */
export const angleDiff = (a: number, b: number) => Math.atan2(Math.sin(b - a), Math.cos(b - a));

import learned from "./learned.json";
const ARM = 0.285 + 0.258;
/**
 * Swivel human signers use for a wrist position (quadratic fit to captured signing,
 * learned.json). S, W in torso space; side picks the mirror.
 */
export function learnedSwivel(side: "R" | "L", S: THREE.Vector3, W: THREE.Vector3): number {
  const m = side === "R" ? 1 : -1;
  const x = ((W.x - S.x) * -m) / ARM, y = (W.y - S.y) / ARM, z = (W.z - S.z) / ARM;
  const f = [1, x, y, z, x * x, y * y, z * z, x * y, x * z, y * z];
  const c = learned.elbow.coef;
  let phi = 0;
  for (let i = 0; i < f.length; i++) phi += f[i] * c[i];
  return phi * m;
}
