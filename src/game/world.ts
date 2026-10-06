import type { Gate, LevelDefinition, Rect, Scanner } from './levels.ts';

export const VIEW_WIDTH = 1280;
export const VIEW_HEIGHT = 660;
export const FLOOR = 540;

export interface InputState {
  left: boolean;
  right: boolean;
  jump: boolean;
  interact: boolean;
}

export interface Body extends Rect {
  vx: number;
  vy: number;
  grounded: boolean;
  facing: 1 | -1;
}

export type WorldEvent = 'jump' | 'switch' | 'death' | 'complete';

export interface GameStatus {
  context: string;
  progress: number;
  plateActive: boolean;
  leverActive: boolean;
  elapsed: number;
  deaths: number;
  dead: boolean;
  deathReason: string;
}

export function overlaps(a: Rect, b: Rect): boolean {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function scannerState(scanner: Scanner, time: number) {
  const phase = (time + scanner.phase) % scanner.period;
  return {
    target: scanner.x + Math.sin((time + scanner.phase) * Math.PI * 2 / scanner.period) * scanner.sweep,
    active: phase < scanner.period * 0.62,
  };
}

const EMPTY_INPUT: InputState = { left: false, right: false, jump: false, interact: false };

export class World {
  readonly level: LevelDefinition;
  readonly onEvent: (event: WorldEvent) => void;
  player!: Body;
  crate: Body | null = null;
  plateActive = false;
  leverActive = false;
  gateOpenAmounts: number[] = [];
  elapsed = 0;
  time = 0;
  deaths = 0;
  deathTimer = 0;
  deathReason = '';
  finished = false;
  exposure = 0;
  camera = 0;
  viewportWidth = VIEW_WIDTH;
  private previousInput = { ...EMPTY_INPUT };

  constructor(level: LevelDefinition, onEvent: (event: WorldEvent) => void = () => {}) {
    this.level = level;
    this.onEvent = onEvent;
    this.resetScene();
  }

  resetScene() {
    this.player = {
      ...this.level.spawn, w: 25, h: 54, vx: 0, vy: 0, grounded: true, facing: 1,
    };
    this.crate = this.level.crate ? {
      ...this.level.crate, vx: 0, vy: 0, grounded: true, facing: 1,
    } : null;
    this.plateActive = false;
    this.leverActive = false;
    this.gateOpenAmounts = this.level.gates.map(() => 0);
    this.exposure = 0;
    this.deathTimer = 0;
    this.time = 0;
    this.camera = 0;
    this.finished = false;
    this.previousInput = { ...EMPTY_INPUT };
  }

  restart() {
    this.elapsed = 0;
    this.deaths = 0;
    this.resetScene();
  }

  gateIsOpen(gate: Gate) {
    return gate.requires === 'plate' ? this.plateActive : this.leverActive;
  }

  solids(): Rect[] {
    return [
      ...this.level.ground,
      ...this.level.platforms,
      ...this.level.gates.filter((gate) => !this.gateIsOpen(gate)),
    ];
  }

  private checkPlate() {
    const plate = this.level.plate;
    if (!plate) return;
    const isOnPlate = (body: Body) => (
      body.x + body.w > plate.x + 4 && body.x < plate.x + plate.w - 4
      && Math.abs(body.y + body.h - (plate.y + plate.h)) < 12
    );
    const active = isOnPlate(this.player) || (this.crate !== null && isOnPlate(this.crate));
    if (active && !this.plateActive) this.onEvent('switch');
    this.plateActive = active;
  }

  private verticalPhysics(body: Body, solids: Rect[], dt: number) {
    const previousY = body.y;
    body.vy += 1600 * dt;
    body.y += body.vy * dt;
    body.grounded = false;
    for (const solid of solids) {
      if (!overlaps(body, solid)) continue;
      if (body.vy >= 0 && previousY + body.h <= solid.y + 6) {
        body.y = solid.y - body.h;
        body.vy = 0;
        body.grounded = true;
      } else if (body.vy < 0 && previousY >= solid.y + solid.h - 6) {
        body.y = solid.y + solid.h;
        body.vy = 0;
      }
    }
  }

  private fail(reason: string) {
    if (this.deathTimer > 0) return;
    this.deaths += 1;
    this.deathReason = reason;
    this.deathTimer = 1.35;
    this.player.vx = 0;
    this.onEvent('death');
  }

  update(dt: number, input: InputState) {
    if (this.finished) return;
    this.elapsed += dt;
    if (this.deathTimer > 0) {
      this.deathTimer -= dt;
      if (this.deathTimer <= 0) this.resetScene();
      return;
    }
    this.time += dt;
    const player = this.player;
    const solids = this.solids();

    if (this.crate) {
      this.verticalPhysics(this.crate, solids, dt);
      if (this.crate.y > VIEW_HEIGHT + 100) {
        this.fail('La caisse s\u2019est perdue dans le vide. Essayez un autre chemin.');
        return;
      }
    }

    const direction = Number(input.right) - Number(input.left);
    player.vx = direction * 235;
    if (direction) player.facing = direction > 0 ? 1 : -1;
    if (input.jump && !this.previousInput.jump && player.grounded) {
      player.vy = -565;
      player.grounded = false;
      this.onEvent('jump');
    }

    const deltaX = player.vx * dt;
    player.x = clamp(player.x + deltaX, 0, this.level.width - player.w);
    for (const solid of solids) {
      if (!overlaps(player, solid)) continue;
      if (deltaX > 0) player.x = solid.x - player.w;
      if (deltaX < 0) player.x = solid.x + solid.w;
    }

    if (this.crate && overlaps(player, this.crate)) {
      const crate = this.crate;
      if (input.interact && crate.grounded && deltaX !== 0) {
        crate.x = clamp(crate.x + deltaX, 0, this.level.width - crate.w);
        for (const solid of solids) {
          if (!overlaps(crate, solid)) continue;
          crate.x = deltaX > 0 ? solid.x - crate.w : solid.x + solid.w;
        }
      }
      if (deltaX > 0) player.x = crate.x - player.w;
      if (deltaX < 0) player.x = crate.x + crate.w;
    }

    this.verticalPhysics(player, this.crate ? [...solids, this.crate] : solids, dt);
    this.checkPlate();

    const lever = this.level.lever;
    if (lever && input.interact && !this.previousInput.interact
      && Math.abs(player.x + player.w / 2 - lever.x) < 62
      && Math.abs(player.y + player.h - lever.y) < 65) {
      this.leverActive = !this.leverActive;
      this.onEvent('switch');
    }

    this.level.gates.forEach((gate, index) => {
      const target = this.gateIsOpen(gate) ? 1 : 0;
      this.gateOpenAmounts[index] += (target - this.gateOpenAmounts[index]) * Math.min(1, dt * 7);
    });

    let seen = false;
    for (const scanner of this.level.scanners) {
      const state = scannerState(scanner, this.time);
      if (!state.active) continue;
      const centerX = player.x + player.w / 2;
      const fraction = clamp((player.y + player.h / 2 - scanner.y) / (FLOOR - scanner.y), 0, 1);
      const beamX = scanner.x + (state.target - scanner.x) * fraction;
      const underCover = this.level.platforms.some((platform) => platform.cover
        && centerX > platform.x && centerX < platform.x + platform.w
        && player.y >= platform.y + platform.h);
      if (!underCover && Math.abs(centerX - beamX) < scanner.width * fraction + 7) seen = true;
    }
    this.exposure = clamp(this.exposure + (seen ? dt : -dt * 2), 0, 1);
    if (this.exposure > 0.3) this.fail('La lumi\u00e8re vous a rep\u00e9r\u00e9. Observez son rythme.');
    if (player.y > VIEW_HEIGHT + 50) this.fail('Le vide n\u2019est pas une issue. Prenez votre \u00e9lan.');

    const targetCamera = clamp(player.x - this.viewportWidth * 0.38, 0, this.level.width - this.viewportWidth);
    this.camera += (targetCamera - this.camera) * Math.min(1, dt * 5);

    if (this.deathTimer <= 0 && player.x + player.w >= this.level.exit
      && player.y < FLOOR && this.level.gates.every((gate) => this.gateIsOpen(gate))) {
      this.finished = true;
      this.onEvent('complete');
    }
    this.previousInput = { ...input };
  }

  getStatus(): GameStatus {
    let context = '';
    const centerX = this.player.x + this.player.w / 2;
    if (this.crate && Math.abs(centerX - (this.crate.x + this.crate.w / 2)) < 84) {
      context = 'Maintenez E + une direction pour pousser la caisse';
    }
    if (this.level.lever && Math.abs(centerX - this.level.lever.x) < 70) {
      context = this.leverActive ? 'E : d\u00e9sactiver le levier' : 'E : activer le levier';
    }
    if (this.exposure > 0.04) context = 'Mettez-vous \u00e0 l\u2019abri !';
    return {
      context,
      progress: Math.round(clamp(this.player.x / this.level.exit, 0, 1) * 100),
      plateActive: this.plateActive,
      leverActive: this.leverActive,
      elapsed: Math.floor(this.elapsed),
      deaths: this.deaths,
      dead: this.deathTimer > 0,
      deathReason: this.deathReason,
    };
  }
}