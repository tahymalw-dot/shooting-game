// js/world.js — خريطة تكتيكية على غرار CS2 + خامات إجرائية CanvasTexture + شبكة A*
export const WORLD_SIZE = 60;
export const GRID_STEP = 2; // دقة شبكة الملاحة A*

function makeProceduralTexture(baseHex, lineHex, style = 'concrete') {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = baseHex;
  ctx.fillRect(0, 0, 256, 256);

  // ضوضاء خفيفة للواقعية
  for (let i = 0; i < 1800; i++) {
    const x = Math.random() * 256;
    const y = Math.random() * 256;
    ctx.fillStyle = Math.random() > 0.5 ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.06)';
    ctx.fillRect(x, y, 2, 2);
  }

  ctx.strokeStyle = lineHex;
  ctx.lineWidth = 3;

  if (style === 'crate') {
    ctx.strokeRect(8, 8, 240, 240);
    ctx.beginPath();
    ctx.moveTo(8, 8);
    ctx.lineTo(248, 248);
    ctx.moveTo(248, 8);
    ctx.lineTo(8, 248);
    ctx.stroke();
    ctx.strokeRect(48, 48, 160, 160);
  } else if (style === 'brick') {
    for (let y = 0; y < 256; y += 32) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(256, y);
      ctx.stroke();
      const offset = (y / 32) % 2 === 0 ? 0 : 32;
      for (let x = offset; x < 256; x += 64) {
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x, y + 32);
        ctx.stroke();
      }
    }
  } else {
    // بلاط أرضية تكتيكي
    ctx.strokeRect(2, 2, 124, 124);
    ctx.strokeRect(130, 2, 124, 124);
    ctx.strokeRect(2, 130, 124, 124);
    ctx.strokeRect(130, 130, 124, 124);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

export function createWorld(scene) {
  // سماء متدرجة وضباب جوي خفيف
  scene.background = new THREE.Color(0x87a8c4);
  scene.fog = new THREE.FogExp2(0x87a8c4, 0.0085);

  const hemi = new THREE.HemisphereLight(0xfff7ed, 0x334155, 0.9);
  scene.add(hemi);

  const sun = new THREE.DirectionalLight(0xfffbeb, 1.05);
  sun.position.set(35, 65, 25);
  sun.castShadow = true;
  sun.shadow.mapSize.width = 1024;
  sun.shadow.mapSize.height = 1024;
  sun.shadow.camera.left = -65;
  sun.shadow.camera.right = 65;
  sun.shadow.camera.top = 65;
  sun.shadow.camera.bottom = -65;
  scene.add(sun);

  const floorTex = makeProceduralTexture('#8c8270', '#6e6555', 'floor');
  floorTex.repeat.set(30, 30);

  const wallTex = makeProceduralTexture('#c2b293', '#9c8c6e', 'brick');
  wallTex.repeat.set(4, 2);

  const crateTex = makeProceduralTexture('#855832', '#4a2e16', 'crate');

  const boxes = [];
  const solid = [];

  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(WORLD_SIZE * 2, WORLD_SIZE * 2),
    new THREE.MeshStandardMaterial({ map: floorTex, roughness: 0.88 })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  function addBox(x, z, w, d, h, type = 'wall') {
    const mat =
      type === 'crate'
        ? new THREE.MeshStandardMaterial({ map: crateTex, roughness: 0.72 })
        : new THREE.MeshStandardMaterial({ map: wallTex, roughness: 0.8 });

    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(x, h / 2, z);
    m.castShadow = true;
    m.receiveShadow = true;
    scene.add(m);
    solid.push(m);
    boxes.push({ x0: x - w / 2, x1: x + w / 2, z0: z - d / 2, z1: z + d / 2, h });
  }

  // الجدران الخارجية المحيطة بالخريطة
  addBox(0, -WORLD_SIZE, WORLD_SIZE * 2, 2, 7, 'wall');
  addBox(0, WORLD_SIZE, WORLD_SIZE * 2, 2, 7, 'wall');
  addBox(-WORLD_SIZE, 0, 2, WORLD_SIZE * 2, 7, 'wall');
  addBox(WORLD_SIZE, 0, 2, WORLD_SIZE * 2, 7, 'wall');

  // تصميم خريطة تكتيكية مستوحاة من Dust2 / Arena (ممرات + ساحة وسطى + سواتر)
  // جدران تقسيم الممرات (Long A / Mid / B)
  addBox(-24, -18, 4, 24, 5.5, 'wall');
  addBox(24, -18, 4, 24, 5.5, 'wall');
  addBox(-24, 20, 4, 22, 5.5, 'wall');
  addBox(24, 20, 4, 22, 5.5, 'wall');

  // بوابات الوسط (Mid Doors)
  addBox(-8, 0, 10, 3, 5.2, 'wall');
  addBox(8, 0, 10, 3, 5.2, 'wall');

  // سواتر وصناديق تكتيكية للتغطية (Cover Crates)
  const crates = [
    [-12, -12, 3.2, 3.2, 2.4],
    [12, -12, 3.2, 3.2, 2.4],
    [-12, 12, 3.2, 3.2, 2.4],
    [12, 12, 3.2, 3.2, 2.4],
    [0, -26, 4.5, 3, 2.5],
    [0, 26, 4.5, 3, 2.5],
    [-38, 0, 3.5, 5, 2.6],
    [38, 0, 3.5, 5, 2.6],
    [-40, -28, 3, 3, 2.2],
    [40, -28, 3, 3, 2.2],
    [-40, 28, 3, 3, 2.2],
    [40, 28, 3, 3, 2.2],
    [-15, -38, 3.5, 2.5, 2.2],
    [15, 38, 3.5, 2.5, 2.2]
  ];
  crates.forEach(([x, z, w, d, h]) => addBox(x, z, w, d, h, 'crate'));

  function isBlocked(x, z, pad = 0.7) {
    if (Math.abs(x) > WORLD_SIZE - 1.5 || Math.abs(z) > WORLD_SIZE - 1.5) return true;
    for (const b of boxes) {
      if (x >= b.x0 - pad && x <= b.x1 + pad && z >= b.z0 - pad && z <= b.z1 + pad) {
        return true;
      }
    }
    return false;
  }

  function pushOut(p, r) {
    for (const b of boxes) {
      const cx = Math.max(b.x0, Math.min(p.x, b.x1));
      const cz = Math.max(b.z0, Math.min(p.z, b.z1));
      const dx = p.x - cx;
      const dz = p.z - cz;
      const d = Math.hypot(dx, dz);
      if (d < r) {
        if (d > 1e-4) {
          p.x += (dx / d) * (r - d);
          p.z += (dz / d) * (r - d);
        } else {
          p.x += r;
        }
      }
    }
  }

  // بناء شبكة A* Pathfinding للملاحة الذكية للأعداء
  const cols = Math.floor((WORLD_SIZE * 2) / GRID_STEP);
  const rows = Math.floor((WORLD_SIZE * 2) / GRID_STEP);
  const walkGrid = Array.from({ length: rows }, (_, r) =>
    Array.from({ length: cols }, (_, c) => {
      const wx = -WORLD_SIZE + c * GRID_STEP + GRID_STEP / 2;
      const wz = -WORLD_SIZE + r * GRID_STEP + GRID_STEP / 2;
      return !isBlocked(wx, wz, 0.65);
    })
  );

  function worldToCell(x, z) {
    const c = Math.max(0, Math.min(cols - 1, Math.floor((x + WORLD_SIZE) / GRID_STEP)));
    const r = Math.max(0, Math.min(rows - 1, Math.floor((z + WORLD_SIZE) / GRID_STEP)));
    return { r, c };
  }

  function cellToWorld(r, c) {
    return new THREE.Vector3(
      -WORLD_SIZE + c * GRID_STEP + GRID_STEP / 2,
      0,
      -WORLD_SIZE + r * GRID_STEP + GRID_STEP / 2
    );
  }

  function findPath(startPos, goalPos) {
    const start = worldToCell(startPos.x, startPos.z);
    const goal = worldToCell(goalPos.x, goalPos.z);
    if (start.r === goal.r && start.c === goal.c) return [goalPos.clone()];

    const key = (r, c) => r * cols + c;
    const open = [{ r: start.r, c: start.c, g: 0, f: Math.hypot(goal.r - start.r, goal.c - start.c) }];
    const cameFrom = new Map();
    const gScore = new Map();
    gScore.set(key(start.r, start.c), 0);
    const closed = new Set();

    const dirs = [
      [1, 0, 1], [-1, 0, 1], [0, 1, 1], [0, -1, 1],
      [1, 1, 1.41], [1, -1, 1.41], [-1, 1, 1.41], [-1, -1, 1.41]
    ];

    let iterations = 0;
    while (open.length > 0 && iterations++ < 450) {
      open.sort((a, b) => a.f - b.f);
      const curr = open.shift();
      const ck = key(curr.r, curr.c);
      if (closed.has(ck)) continue;
      closed.add(ck);

      if (Math.abs(curr.r - goal.r) <= 1 && Math.abs(curr.c - goal.c) <= 1) {
        const path = [goalPos.clone()];
        let trace = ck;
        while (cameFrom.has(trace)) {
          const pr = Math.floor(trace / cols);
          const pc = trace % cols;
          path.unshift(cellToWorld(pr, pc));
          trace = cameFrom.get(trace);
        }
        return path;
      }

      for (const [dr, dc, cost] of dirs) {
        const nr = curr.r + dr;
        const nc = curr.c + dc;
        if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;
        if (!walkGrid[nr][nc]) continue;
        const nk = key(nr, nc);
        if (closed.has(nk)) continue;

        const tentativeG = curr.g + cost;
        if (tentativeG < (gScore.get(nk) ?? Infinity)) {
          cameFrom.set(nk, ck);
          gScore.set(nk, tentativeG);
          const h = Math.hypot(goal.r - nr, goal.c - nc);
          open.push({ r: nr, c: nc, g: tentativeG, f: tentativeG + h });
        }
      }
    }
    return [goalPos.clone()];
  }

  // بورتات تكتيكية
  const portals = [];
  function mkPortal(x, z, c) {
    const m = new THREE.Mesh(
      new THREE.TorusGeometry(1.45, 0.16, 14, 36),
      new THREE.MeshBasicMaterial({ color: c })
    );
    m.position.set(x, 1.65, z);
    scene.add(m);
    const disc = new THREE.Mesh(
      new THREE.CircleGeometry(1.35, 28),
      new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0.35, side: THREE.DoubleSide })
    );
    m.add(disc);
    portals.push(m);
  }
  mkPortal(-48, -48, 0x38bdf8);
  mkPortal(48, 48, 0xfb923c);

  return { boxes, solid, portals, pushOut, findPath, isBlocked };
}
