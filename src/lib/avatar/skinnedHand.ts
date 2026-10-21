import * as THREE from "three";
import { HAND_DIMS } from "./handRig";

// One continuous, skinned hand surface. The rest-pose hand is described as a
// signed distance field (round cones and ellipsoids in each bone's frame, blended
// with smooth-min so the palm, webbing, thenar pad and knuckles flow into each
// other), meshed with surface nets, then skinned to the rig's bones by distance.
// The bones are the same joints handRig already drives, so every handshape and
// contact point is unchanged — only the surface is new.

/** Bone order: root, then [mcp, pip, dip] for i m r p, then thumb [cmc, mcp, ip]. */
export const BONE_COUNT = 16;
const CHAIN_OF = [-1, 0, 0, 0, 1, 1, 1, 2, 2, 2, 3, 3, 3, 4, 4, 4];

const enum Kind { Cone, Ellipsoid }

interface Prim {
  kind: Kind;
  /** root space → primitive space (bone frame, then anisotropic scale) */
  inv: THREE.Matrix4;
  /** cone: r0, r1, h; ellipsoid: rx, ry, rz */
  a: number; b: number; c: number;
  /** distance correction for the anisotropic scale */
  scale: number;
  /** smooth-min radius when blending into everything before it */
  k: number;
  box: THREE.Box3;
}

/** Skin-weight sources: a bone owns one or more axis segments with a radius. */
interface Seg { bone: number; a: THREE.Vector3; b: THREE.Vector3; r0: number; r1: number }

function smin(a: number, b: number, k: number) {
  if (k <= 0) return Math.min(a, b);
  const h = Math.max(k - Math.abs(a - b), 0) / k;
  return Math.min(a, b) - h * h * k * 0.25;
}

function sdRoundCone(x: number, y: number, z: number, r0: number, r1: number, h: number) {
  const qx = Math.hypot(x, z), qy = y;
  const b = (r0 - r1) / h, a = Math.sqrt(1 - b * b);
  const k = -b * qx + a * qy;
  if (k < 0) return Math.hypot(qx, qy) - r0;
  if (k > a * h) return Math.hypot(qx, qy - h) - r1;
  return qx * a + qy * b - r0;
}

function sdEllipsoid(x: number, y: number, z: number, rx: number, ry: number, rz: number) {
  const k0 = Math.hypot(x / rx, y / ry, z / rz);
  const k1 = Math.hypot(x / (rx * rx), y / (ry * ry), z / (rz * rz));
  return k1 > 0 ? (k0 * (k0 - 1)) / k1 : -Math.min(rx, ry, rz);
}

const tmpV = new THREE.Vector3();

function makePrim(kind: Kind, frame: THREE.Matrix4, a: number, b: number, c: number, k: number, sx = 1, sz = 1): Prim {
  const S = new THREE.Matrix4().makeScale(sx, 1, sz);
  const fwd = frame.clone().multiply(S);
  const inv = fwd.clone().invert();
  const box = new THREE.Box3();
  const ext = kind === Kind.Cone ? [-Math.max(a, b), -Math.max(a, b), c + Math.max(a, b)] : [-a, -b, b];
  const ex = kind === Kind.Cone ? Math.max(a, b) : a, ez = kind === Kind.Cone ? Math.max(a, b) : c;
  for (const x of [-ex, ex]) for (const y of [ext[1], ext[2]]) for (const z of [-ez, ez]) box.expandByPoint(tmpV.set(x, y, z).applyMatrix4(fwd));
  return { kind, inv, a, b, c, scale: Math.min(sx, sz, 1), k, box };
}

/** Bone-local frame in root space with an extra local offset. */
function at(m: THREE.Matrix4, x = 0, y = 0, z = 0) {
  return m.clone().multiply(new THREE.Matrix4().makeTranslation(x, y, z));
}

/** Frame at `from` whose +Y points to `to` and whose +Z stays near `zHint`. */
function segFrame(from: THREE.Vector3, to: THREE.Vector3, zHint: THREE.Vector3) {
  const y = to.clone().sub(from).normalize();
  const z = zHint.clone().addScaledVector(y, -zHint.dot(y)).normalize();
  const x = new THREE.Vector3().crossVectors(y, z);
  return new THREE.Matrix4().makeBasis(x, y, z).setPosition(from);
}

function buildField(rest: THREE.Matrix4[]) {
  const D = HAND_DIMS;
  const prims: Prim[] = [];
  const segs: Seg[] = [];
  const pos = (i: number) => new THREE.Vector3().setFromMatrixPosition(rest[i]);
  const Z = new THREE.Vector3(0, 0, 1);
  const I = new THREE.Matrix4();

  // Palm: metacarpals fanning from the carpus to each knuckle, merged into a slab.
  const fingers = ["i", "m", "r", "p"] as const;
  const baseX = [0.017, 0.005, -0.007, -0.018];
  fingers.forEach((k, j) => {
    const f = D.fingers[k];
    const from = new THREE.Vector3(baseX[j], 0.012, 0.001);
    const to = pos(1 + 3 * j);
    const len = to.distanceTo(from);
    const r0 = 0.0108, r1 = f.r * 1.32;
    prims.push(makePrim(Kind.Cone, segFrame(from, to, Z), r0, r1, len, 0.012, 1, 0.98));
    segs.push({ bone: 0, a: from, b: to, r0, r1 });
  });
  // Wrist / carpus, wider than deep
  prims.push(makePrim(Kind.Cone, at(I, 0, -0.012, 0), 0.0225, 0.0235, 0.028, 0.014, 1.12, 0.66));
  segs.push({ bone: 0, a: new THREE.Vector3(0, -0.012, 0), b: new THREE.Vector3(0, 0.016, 0), r0: 0.024, r1: 0.025 });
  // Hypothenar (little-finger side of the palm) and a soft palm centre
  prims.push(makePrim(Kind.Ellipsoid, at(I, -0.021, 0.034, 0.004), 0.013, 0.03, 0.0125, 0.01));
  prims.push(makePrim(Kind.Ellipsoid, at(I, 0.0, 0.05, 0.004), 0.03, 0.03, 0.0115, 0.012));

  // Thumb: metacarpal rides in the thenar pad, then two phalanges and a pad.
  const T = D.thumb;
  const tr = T.r;
  // Nothing of the thumb hangs below its pivot (it would swing into the wrist);
  // the thenar pad belongs to the palm.
  prims.push(makePrim(Kind.Cone, rest[13], tr * 1.4, tr * 1.08, T.len[0], 0.014, 1, 0.9));
  const thenar = new THREE.Vector3(0.019, 0.03, 0.007);
  prims.push(makePrim(Kind.Ellipsoid, at(I, thenar.x, thenar.y, thenar.z).multiply(new THREE.Matrix4().makeRotationZ(-0.45)), 0.016, 0.028, 0.0125, 0.014));
  segs.push({ bone: 0, a: new THREE.Vector3(0.012, 0.008, 0.005), b: thenar.clone().add(new THREE.Vector3(0.006, 0.012, 0)), r0: 0.013, r1: 0.012 });
  prims.push(makePrim(Kind.Cone, rest[14], tr * 1.06, tr * 0.95, T.len[1], 0.004, 1, 0.88));
  prims.push(makePrim(Kind.Cone, rest[15], tr * 0.95, tr * 0.76, T.len[2] - tr * 0.15, 0, 1, 0.88));
  prims.push(makePrim(Kind.Ellipsoid, at(rest[15], 0, T.len[2] * 0.52, tr * 0.16), tr * 0.76, tr * 1.0, tr * 0.6, 0.002));
  segs.push({ bone: 13, a: pos(13).lerp(pos(14), 0.3), b: pos(14), r0: tr * 1.3, r1: tr * 1.08 });
  segs.push({ bone: 14, a: pos(14), b: pos(15), r0: tr * 1.04, r1: tr * 0.96 });
  segs.push({ bone: 15, a: pos(15), b: new THREE.Vector3(0, T.len[2], 0).applyMatrix4(rest[15]), r0: tr * 0.95, r1: tr * 0.76 });

  // Fingers: tapering phalanges, slightly flattened, with knuckle swellings and pads.
  fingers.forEach((k, j) => {
    const f = D.fingers[k];
    const [b0, b1, b2] = [1 + 3 * j, 2 + 3 * j, 3 + 3 * j];
    const r = f.r;
    // Segments meet with equal radii, so a hard union is already seamless; only
    // the base blends into the palm (knuckle and webbing).
    prims.push(makePrim(Kind.Cone, rest[b0], r * 1.04, r * 0.94, f.len[0], 0.0075, 1, 0.88));
    prims.push(makePrim(Kind.Cone, rest[b1], r * 0.94, r * 0.86, f.len[1], 0, 1, 0.88));
    prims.push(makePrim(Kind.Cone, rest[b2], r * 0.86, r * 0.72, f.len[2] - r * 0.12, 0, 1, 0.88));
    // a faint swelling on the back of each finger joint
    prims.push(makePrim(Kind.Ellipsoid, at(rest[b1], 0, 0, -r * 0.3), r * 0.7, r * 0.85, r * 0.55, 0.002));
    prims.push(makePrim(Kind.Ellipsoid, at(rest[b2], 0, 0, -r * 0.28), r * 0.62, r * 0.75, r * 0.5, 0.002));
    // fingertip pad
    prims.push(makePrim(Kind.Ellipsoid, at(rest[b2], 0, f.len[2] * 0.5, r * 0.14), r * 0.72, r * 0.95, r * 0.6, 0.002));
    const tip = new THREE.Vector3(0, f.len[2], 0).applyMatrix4(rest[b2]);
    segs.push({ bone: b0, a: pos(b0), b: pos(b1), r0: r * 1.04, r1: r * 0.94 });
    segs.push({ bone: b1, a: pos(b1), b: pos(b2), r0: r * 0.94, r1: r * 0.86 });
    segs.push({ bone: b2, a: pos(b2), b: tip, r0: r * 0.86, r1: r * 0.72 });
  });

  // Flattened for speed: the field is sampled about a million times.
  const FAR = 0.016, W = 23;
  const P = new Float64Array(prims.length * W);
  prims.forEach((pr, i) => {
    const e = pr.inv.elements, o = i * W;
    // column-major 3x4 affine part
    P.set([e[0], e[1], e[2], e[4], e[5], e[6], e[8], e[9], e[10], e[12], e[13], e[14]], o);
    P.set([pr.box.min.x, pr.box.min.y, pr.box.min.z, pr.box.max.x, pr.box.max.y, pr.box.max.z], o + 12);
    P.set([pr.kind, pr.a, pr.b, pr.c, pr.scale], o + 18);
  });
  const K = prims.map((pr) => pr.k);
  const bounds = new THREE.Box3();
  for (const pr of prims) bounds.union(pr.box);
  bounds.expandByScalar(0.008);
  // Bin space so each sample only visits the primitives that can reach it.
  const BIN = 0.008, lo = bounds.min.clone().subScalar(FAR);
  const bdim = bounds.getSize(new THREE.Vector3()).addScalar(2 * FAR).divideScalar(BIN).ceil();
  const bins: Int16Array[] = [];
  const cellBox = new THREE.Box3();
  for (let z = 0; z < bdim.z; z++) for (let y = 0; y < bdim.y; y++) for (let x = 0; x < bdim.x; x++) {
    cellBox.min.set(lo.x + x * BIN, lo.y + y * BIN, lo.z + z * BIN);
    cellBox.max.copy(cellBox.min).addScalar(BIN);
    const ids: number[] = [];
    prims.forEach((pr, i) => {
      const gap = Math.hypot(
        Math.max(pr.box.min.x - cellBox.max.x, 0, cellBox.min.x - pr.box.max.x),
        Math.max(pr.box.min.y - cellBox.max.y, 0, cellBox.min.y - pr.box.max.y),
        Math.max(pr.box.min.z - cellBox.max.z, 0, cellBox.min.z - pr.box.max.z),
      );
      if (gap <= FAR) ids.push(i);
    });
    bins.push(Int16Array.from(ids));
  }
  function sdf(x: number, y: number, z: number) {
    const bx = Math.floor((x - lo.x) / BIN), by = Math.floor((y - lo.y) / BIN), bz = Math.floor((z - lo.z) / BIN);
    if (bx < 0 || by < 0 || bz < 0 || bx >= bdim.x || by >= bdim.y || bz >= bdim.z) return FAR;
    const ids = bins[bx + bdim.x * (by + bdim.y * bz)];
    let d = FAR;
    for (let j = 0; j < ids.length; j++) {
      const i = ids[j], o = i * W;
      const px = P[o] * x + P[o + 3] * y + P[o + 6] * z + P[o + 9];
      const py = P[o + 1] * x + P[o + 4] * y + P[o + 7] * z + P[o + 10];
      const pz = P[o + 2] * x + P[o + 5] * y + P[o + 8] * z + P[o + 11];
      const v = (P[o + 18] === Kind.Cone ? sdRoundCone(px, py, pz, P[o + 19], P[o + 20], P[o + 21]) : sdEllipsoid(px, py, pz, P[o + 19], P[o + 20], P[o + 21])) * P[o + 22];
      d = j === 0 ? v : smin(d, v, K[i]);
    }
    return d;
  }
  return { sdf, segs, bounds };
}

/** Naive surface nets over the field's bounding box. */
function mesh(sdf: (x: number, y: number, z: number) => number, bounds: THREE.Box3, cell: number) {
  const o = bounds.min.clone().subScalar(cell * 2);
  const size = bounds.getSize(new THREE.Vector3()).addScalar(cell * 4);
  const nx = Math.ceil(size.x / cell) + 1, ny = Math.ceil(size.y / cell) + 1, nz = Math.ceil(size.z / cell) + 1;
  // Coarse pass first; only samples near the surface need the exact field.
  const C4 = 4, gx = Math.ceil(nx / C4) + 1, gy = Math.ceil(ny / C4) + 1, gz = Math.ceil(nz / C4) + 1;
  const coarse = new Float32Array(gx * gy * gz);
  for (let z = 0; z < gz; z++) for (let y = 0; y < gy; y++) for (let x = 0; x < gx; x++)
    coarse[x + gx * (y + gy * z)] = sdf(o.x + x * C4 * cell, o.y + y * C4 * cell, o.z + z * C4 * cell);
  const near = C4 * cell;
  const f = new Float32Array(nx * ny * nz);
  for (let z = 0; z < nz; z++) for (let y = 0; y < ny; y++) for (let x = 0; x < nx; x++) {
    const c = coarse[Math.round(x / C4) + gx * (Math.round(y / C4) + gy * Math.round(z / C4))];
    f[x + nx * (y + ny * z)] = Math.abs(c) > near ? c : sdf(o.x + x * cell, o.y + y * cell, o.z + z * cell);
  }

  const cx = nx - 1, cy = ny - 1;
  const cellVert = new Int32Array(cx * cy * (nz - 1)).fill(-1);
  const verts: number[] = [];
  const corner = new Float32Array(8);
  const EDGES = [[0, 1], [2, 3], [4, 5], [6, 7], [0, 2], [1, 3], [4, 6], [5, 7], [0, 4], [1, 5], [2, 6], [3, 7]];
  for (let z = 0; z < nz - 1; z++) for (let y = 0; y < cy; y++) for (let x = 0; x < cx; x++) {
    let mask = 0;
    for (let c = 0; c < 8; c++) {
      const v = f[x + (c & 1) + nx * (y + ((c >> 1) & 1) + ny * (z + (c >> 2)))];
      corner[c] = v;
      if (v < 0) mask |= 1 << c;
    }
    if (mask === 0 || mask === 255) continue;
    let sx = 0, sy = 0, sz = 0, n = 0;
    for (const [a, b] of EDGES) {
      const va = corner[a], vb = corner[b];
      if ((va < 0) === (vb < 0)) continue;
      const t = va / (va - vb);
      sx += (a & 1) + t * ((b & 1) - (a & 1));
      sy += ((a >> 1) & 1) + t * (((b >> 1) & 1) - ((a >> 1) & 1));
      sz += (a >> 2) + t * ((b >> 2) - (a >> 2));
      n++;
    }
    cellVert[x + cx * (y + cy * z)] = verts.length / 3;
    verts.push(o.x + (x + sx / n) * cell, o.y + (y + sy / n) * cell, o.z + (z + sz / n) * cell);
  }

  const idx: number[] = [];
  const C = (x: number, y: number, z: number) => cellVert[x + cx * (y + cy * z)];
  const quad = (a: number, b: number, c: number, d: number, flip: boolean) => {
    if (a < 0 || b < 0 || c < 0 || d < 0) return;
    if (flip) idx.push(a, c, b, a, d, c);
    else idx.push(a, b, c, a, c, d);
  };
  for (let z = 1; z < nz - 1; z++) for (let y = 1; y < ny - 1; y++) for (let x = 1; x < nx - 1; x++) {
    const inside = f[x + nx * (y + ny * z)] < 0;
    if (inside !== f[x + 1 + nx * (y + ny * z)] < 0) quad(C(x, y - 1, z - 1), C(x, y, z - 1), C(x, y, z), C(x, y - 1, z), !inside);
    if (inside !== f[x + nx * (y + 1 + ny * z)] < 0) quad(C(x - 1, y, z - 1), C(x - 1, y, z), C(x, y, z), C(x, y, z - 1), !inside);
    if (inside !== f[x + nx * (y + ny * (z + 1))] < 0) quad(C(x - 1, y - 1, z), C(x, y - 1, z), C(x, y, z), C(x - 1, y, z), !inside);
  }
  return { verts: new Float32Array(verts), idx };
}

function segDist(p: THREE.Vector3, s: Seg) {
  const ab = tmpV.copy(s.b).sub(s.a);
  const t = Math.min(1, Math.max(0, p.clone().sub(s.a).dot(ab) / ab.lengthSq()));
  const q = s.a.clone().addScaledVector(ab, t);
  return p.distanceTo(q) - (s.r0 + (s.r1 - s.r0) * t);
}

/**
 * Skin weights: nearest bones by distance to their surface, limited to the owning
 * finger chain, then diffused over the mesh so no transition is sharp enough to fold.
 */
function weigh(verts: Float32Array, idx: number[], segs: Seg[]) {
  const n = verts.length / 3, B = BONE_COUNT;
  let W = new Float32Array(n * B);
  const p = new THREE.Vector3();
  const d = new Float32Array(B);
  const SIGMA = 0.0028;
  for (let v = 0; v < n; v++) {
    p.fromArray(verts, v * 3);
    d.fill(Infinity);
    for (const s of segs) d[s.bone] = Math.min(d[s.bone], segDist(p, s));
    let best = 0;
    for (let b = 1; b < B; b++) if (d[b] < d[best]) best = b;
    const chain = CHAIN_OF[best];
    let sum = 0;
    for (let b = 0; b < B; b++) {
      // Palm skin may follow any knuckle's first bone; finger skin only its own chain.
      const ok = b === 0 || (chain < 0 ? (b - 1) % 3 === 0 : CHAIN_OF[b] === chain);
      if (!ok || d[b] === Infinity) continue;
      const w = Math.exp(-(d[b] - d[best]) / SIGMA);
      W[v * B + b] = w;
      sum += w;
    }
    for (let b = 0; b < B; b++) W[v * B + b] /= sum;
  }
  // Laplacian diffusion of the weights over the surface (each pass ≈ one cell).
  const adj: number[][] = Array.from({ length: n }, () => []);
  for (let i = 0; i < idx.length; i += 3)
    for (let e = 0; e < 3; e++) {
      const a = idx[i + e], c = idx[i + ((e + 1) % 3)];
      adj[a].push(c);
      adj[c].push(a);
    }
  let next = new Float32Array(n * B);
  for (let it = 0; it < 6; it++) {
    for (let v = 0; v < n; v++) {
      const nb = adj[v];
      for (let b = 0; b < B; b++) {
        let acc = 0;
        for (const u of nb) acc += W[u * B + b];
        next[v * B + b] = 0.5 * W[v * B + b] + (nb.length ? (0.5 * acc) / nb.length : 0.5 * W[v * B + b]);
      }
    }
    [W, next] = [next, W];
  }
  const skinIndex = new Uint16Array(n * 4);
  const skinWeight = new Float32Array(n * 4);
  const order = Array.from({ length: B }, (_, i) => i);
  for (let v = 0; v < n; v++) {
    order.sort((a, b) => W[v * B + b] - W[v * B + a]);
    let sum = 0;
    for (let i = 0; i < 4; i++) sum += W[v * B + order[i]];
    for (let i = 0; i < 4; i++) {
      skinIndex[v * 4 + i] = order[i];
      skinWeight[v * 4 + i] = W[v * B + order[i]] / sum;
    }
  }
  return { skinIndex, skinWeight };
}

let cached: THREE.BufferGeometry | null = null;

/**
 * Right-hand rest geometry for bones posed at `rest` (root-space matrices, in
 * BONE order). The left hand is its mirror image. Built once per page.
 */
export function handSkinGeometry(side: "R" | "L", rest: THREE.Matrix4[]): THREE.BufferGeometry {
  if (!cached) {
    const right = side === "R" ? rest : rest.map((m) => new THREE.Matrix4().makeScale(-1, 1, 1).multiply(m).multiply(new THREE.Matrix4().makeScale(-1, 1, 1)));
    const { sdf, segs, bounds } = buildField(right);
    const { verts, idx } = mesh(sdf, bounds, 0.0012);
    // Project each vertex onto the surface along the field gradient for smooth normals.
    const normals = new Float32Array(verts.length);
    const e = 0.0004;
    for (let i = 0; i < verts.length; i += 3) {
      const x = verts[i], y = verts[i + 1], z = verts[i + 2];
      const dv = sdf(x, y, z);
      let gx = sdf(x + e, y, z) - dv;
      let gy = sdf(x, y + e, z) - dv;
      let gz = sdf(x, y, z + e) - dv;
      const l = Math.hypot(gx, gy, gz) || 1;
      gx /= l; gy /= l; gz /= l;
      verts[i] = x - gx * dv; verts[i + 1] = y - gy * dv; verts[i + 2] = z - gz * dv;
      normals[i] = gx; normals[i + 1] = gy; normals[i + 2] = gz;
    }
    const { skinIndex, skinWeight } = weigh(verts, idx, segs);
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(verts, 3));
    g.setAttribute("normal", new THREE.BufferAttribute(normals, 3));
    g.setAttribute("skinIndex", new THREE.Uint16BufferAttribute(skinIndex, 4));
    g.setAttribute("skinWeight", new THREE.BufferAttribute(skinWeight, 4));
    g.setIndex(idx);
    cached = g;
  }
  if (side === "R") return cached.clone();
  // Mirror across X and reverse the winding.
  const g = cached.clone();
  const P = g.getAttribute("position") as THREE.BufferAttribute;
  const N = g.getAttribute("normal") as THREE.BufferAttribute;
  for (let i = 0; i < P.count; i++) {
    P.setX(i, -P.getX(i));
    N.setX(i, -N.getX(i));
  }
  const ix = g.getIndex()!;
  for (let i = 0; i < ix.count; i += 3) {
    const b = ix.getX(i + 1);
    ix.setX(i + 1, ix.getX(i + 2));
    ix.setX(i + 2, b);
  }
  return g;
}
