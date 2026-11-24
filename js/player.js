// js/player.js — حركة اللاعب التكتيكية، الدرع، التصادم، والبورتات
import { WORLD_SIZE } from './world.js';
import { playSound } from './weapons.js';

export class PlayerController {
  constructor(cam) {
    this.cam = cam;
    this.pos = new THREE.Vector3(0, 1.72, 42);
    this.vy = 0;
    this.hp = 100;
    this.armor = 50;
    this.ground = true;
    this.yaw = 0;
    this.pitch = 0;
    this.portalCD = 0;
  }

  reset() {
    this.hp = 100;
    this.armor = 50;
    this.pos.set(0, 1.72, 42);
    this.vy = 0;
    this.ground = true;
    this.yaw = 0;
    this.pitch = 0;
    this.portalCD = 0;
  }

  addLook(dx, dy, sens = 0.0024) {
    this.yaw -= dx * sens;
    this.pitch = Math.max(-1.45, Math.min(1.45, this.pitch - dy * sens));
  }

  takeDamage(rawDmg) {
    if (this.armor > 0) {
      const absorbed = Math.min(this.armor, Math.ceil(rawDmg * 0.55));
      this.armor -= absorbed;
      this.hp -= rawDmg - absorbed;
    } else {
      this.hp -= rawDmg;
    }
    if (this.hp < 0) this.hp = 0;
  }

  update(dt, moveInput, portals, pushOut) {
    const { forward, right, sprint, jump } = moveInput;
    const speed = sprint ? 10.0 : 6.8;

    const s = Math.sin(this.yaw);
    const c = Math.cos(this.yaw);
    let mx = -s * forward + c * right;
    let mz = -c * forward - s * right;
    const len = Math.hypot(mx, mz);

    if (len > 0.01) {
      const factor = Math.min(1, len);
      this.pos.x += (mx / len) * factor * speed * dt;
      this.pos.z += (mz / len) * factor * speed * dt;
    }

    pushOut(this.pos, 0.55);
    this.pos.x = Math.max(-WORLD_SIZE + 1.3, Math.min(WORLD_SIZE - 1.3, this.pos.x));
    this.pos.z = Math.max(-WORLD_SIZE + 1.3, Math.min(WORLD_SIZE - 1.3, this.pos.z));

    if (jump && this.ground) {
      this.vy = 7.3;
      this.ground = false;
    }
    this.vy -= 20 * dt;
    this.pos.y += this.vy * dt;
    if (this.pos.y <= 1.72) {
      this.pos.y = 1.72;
      this.vy = 0;
      this.ground = true;
    }

    this.cam.position.copy(this.pos);
    this.cam.rotation.set(this.pitch, this.yaw, 0, 'YXZ');

    if (this.portalCD > 0) this.portalCD -= dt;
    portals.forEach((p, idx) => {
      p.rotation.z += dt * 2.4;
      if (
        this.portalCD <= 0 &&
        Math.hypot(p.position.x - this.pos.x, p.position.z - this.pos.z) < 1.65
      ) {
        const other = portals[1 - idx];
        this.pos.x = other.position.x + (other.position.x > 0 ? -3.4 : 3.4);
        this.pos.z = other.position.z + (other.position.z > 0 ? -3.4 : 3.4);
        this.portalCD = 2.0;
        playSound('buy');
      }
    });
  }
}
