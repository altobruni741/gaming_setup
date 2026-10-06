import type { LevelDefinition, Rect } from './levels';
import { clamp, FLOOR, scannerState, VIEW_HEIGHT, VIEW_WIDTH, World } from './world';
import type { GameStatus, InputState, WorldEvent } from './world';

interface EngineCallbacks {
  onStatus: (status: GameStatus) => void;
  onEvent: (event: WorldEvent, world: World) => void;
}

const KEY_ACTIONS: Record<string, keyof InputState> = {
  ArrowLeft: 'left', KeyA: 'left', KeyQ: 'left',
  ArrowRight: 'right', KeyD: 'right',
  ArrowUp: 'jump', KeyW: 'jump', KeyZ: 'jump', Space: 'jump',
  KeyE: 'interact',
};

function noise(seed: number) {
  const value = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return value - Math.floor(value);
}

export class GameEngine {
  readonly world: World;
  private canvas: HTMLCanvasElement;
  private context: CanvasRenderingContext2D;
  private callbacks: EngineCallbacks;
  private image = new Image();
  private keys = new Set<string>();
  private touchInput: InputState = { left: false, right: false, jump: false, interact: false };
  private paused = false;
  private frameId = 0;
  private previousTime = 0;
  private accumulator = 0;
  private statusTimer = 0;
  private lastStatus = '';
  private dpr: number;
  private animateAtmosphere: boolean;
  private viewportWidth = VIEW_WIDTH;
  private resizeObserver: ResizeObserver;

  constructor(canvas: HTMLCanvasElement, level: LevelDefinition, callbacks: EngineCallbacks, motion = true) {
    this.canvas = canvas;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Canvas 2D indisponible.');
    this.context = context;
    this.callbacks = callbacks;
    this.animateAtmosphere = motion && !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.dpr = Math.min(window.devicePixelRatio || 1, 1.75);
    this.world = new World(level, (event) => callbacks.onEvent(event, this.world));
    this.resizeObserver = new ResizeObserver(this.resize);
    this.resizeObserver.observe(canvas.parentElement || canvas);
    this.resize();
    this.image.src = level.image;
    this.image.decoding = 'async';
    window.addEventListener('keydown', this.keyDown);
    window.addEventListener('keyup', this.keyUp);
    window.addEventListener('blur', this.clearInput);
    this.frameId = requestAnimationFrame(this.frame);
  }

  private resize = () => {
    const bounds = (this.canvas.parentElement || this.canvas).getBoundingClientRect();
    this.viewportWidth = clamp(Math.round(bounds.width / Math.max(1, bounds.height) * VIEW_HEIGHT), 360, 1600);
    this.world.viewportWidth = this.viewportWidth;
    this.canvas.width = this.viewportWidth * this.dpr;
    this.canvas.height = VIEW_HEIGHT * this.dpr;
  };

  private keyDown = (event: KeyboardEvent) => {
    if (!(event.code in KEY_ACTIONS) || this.paused) return;
    if (event.target instanceof HTMLElement && event.target.closest('dialog, input, textarea, select')) return;
    event.preventDefault();
    this.keys.add(event.code);
  };

  private keyUp = (event: KeyboardEvent) => {
    this.keys.delete(event.code);
  };

  clearInput = () => {
    this.keys.clear();
    this.touchInput = { left: false, right: false, jump: false, interact: false };
  };

  setTouchInput(action: keyof InputState, pressed: boolean) {
    this.touchInput[action] = pressed;
  }

  setPaused(paused: boolean) {
    this.paused = paused;
    this.clearInput();
    this.accumulator = 0;
  }

  restart() {
    this.world.restart();
    this.clearInput();
    this.lastStatus = '';
  }

  private input(): InputState {
    const input = { ...this.touchInput };
    this.keys.forEach((key) => {
      const action = KEY_ACTIONS[key];
      if (action) input[action] = true;
    });
    return input;
  }

  private frame = (now: number) => {
    const dt = this.previousTime ? Math.min((now - this.previousTime) / 1000, 0.08) : 0;
    this.previousTime = now;
    if (!this.paused) {
      // A fixed simulation step keeps jumps and puzzle timings identical at any refresh rate.
      this.accumulator += dt;
      while (this.accumulator >= 1 / 60) {
        this.world.update(1 / 60, this.input());
        this.accumulator -= 1 / 60;
      }
      this.statusTimer += dt;
      if (this.statusTimer >= 0.12) {
        const status = this.world.getStatus();
        const serialized = JSON.stringify(status);
        if (serialized !== this.lastStatus) {
          this.callbacks.onStatus(status);
          this.lastStatus = serialized;
        }
        this.statusTimer = 0;
      }
    }
    this.draw();
    this.frameId = requestAnimationFrame(this.frame);
  };

  private draw() {
    const ctx = this.context;
    const world = this.world;
    const level = world.level;
    const width = this.viewportWidth;
    const time = this.animateAtmosphere ? world.time : 0;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.clearRect(0, 0, width, VIEW_HEIGHT);
    ctx.fillStyle = '#394039';
    ctx.fillRect(0, 0, width, VIEW_HEIGHT);

    if (this.image.complete && this.image.naturalWidth) {
      ctx.globalAlpha = 0.83;
      const sourceHeight = this.image.height * 0.72;
      const sourceWidth = Math.min(this.image.width, sourceHeight * (width + 300) / (FLOOR + 65));
      ctx.drawImage(this.image, (this.image.width - sourceWidth) * 0.55, 0, sourceWidth, sourceHeight,
        -world.camera * 0.12, -25, width + 300, FLOOR + 65);
      ctx.globalAlpha = 1;
    }
    const atmosphere = ctx.createLinearGradient(0, 0, 0, VIEW_HEIGHT);
    atmosphere.addColorStop(0, 'rgba(10,18,14,0.3)');
    atmosphere.addColorStop(0.6, 'rgba(37,48,39,0.12)');
    atmosphere.addColorStop(1, '#080d0a');
    ctx.fillStyle = atmosphere;
    ctx.fillRect(0, 0, width, VIEW_HEIGHT);

    ctx.save();
    ctx.translate(-world.camera, 0);
    this.drawScanners();
    this.drawExit();

    for (const ground of level.ground) this.drawGround(ground);
    for (const platform of level.platforms) {
      ctx.fillStyle = level.id === 0 ? '#151e17' : '#202923';
      ctx.fillRect(platform.x, platform.y, platform.w, platform.h);
      ctx.fillStyle = '#68705a';
      ctx.fillRect(platform.x, platform.y, platform.w, 2);
      if (platform.cover) {
        ctx.fillStyle = '#151d17';
        ctx.fillRect(platform.x + 5, platform.y + 12, 5, FLOOR - platform.y - 12);
        ctx.fillRect(platform.x + platform.w - 10, platform.y + 12, 5, FLOOR - platform.y - 12);
        ctx.strokeStyle = '#45503f';
        ctx.lineWidth = 1;
        for (let x = platform.x + 10; x < platform.x + platform.w; x += 19) {
          ctx.beginPath();
          ctx.moveTo(x, platform.y + 3);
          ctx.lineTo(x + 12, platform.y + 20);
          ctx.stroke();
        }
      }
    }

    if (level.plate) {
      const plate = level.plate;
      ctx.save();
      ctx.strokeStyle = world.plateActive ? 'rgba(187,206,128,0.45)' : 'rgba(144,151,120,0.23)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(plate.x + plate.w, FLOOR + 9);
      ctx.lineTo(level.gates[0].x + 10, FLOOR + 9);
      ctx.lineTo(level.gates[0].x + 10, FLOOR - 40);
      ctx.stroke();
      ctx.shadowBlur = world.plateActive ? 22 : 8;
      ctx.shadowColor = '#cfdf95';
      ctx.fillStyle = world.plateActive ? '#c9dc8d' : '#7c8764';
      ctx.fillRect(plate.x, plate.y + (world.plateActive ? 3 : 0), plate.w, world.plateActive ? 4 : plate.h);
      ctx.restore();
    }

    level.gates.forEach((gate, index) => {
      ctx.fillStyle = '#151c17';
      ctx.fillRect(gate.x - 10, gate.y - 17, gate.w + 20, 20);
      ctx.fillRect(gate.x - 9, gate.y, 6, gate.h);
      ctx.fillRect(gate.x + gate.w + 3, gate.y, 6, gate.h);
      ctx.save();
      ctx.beginPath();
      ctx.rect(gate.x, gate.y, gate.w, gate.h);
      ctx.clip();
      const top = gate.y - world.gateOpenAmounts[index] * gate.h;
      ctx.fillStyle = '#28322a';
      ctx.fillRect(gate.x, top, gate.w, gate.h);
      ctx.strokeStyle = '#5e6953';
      ctx.lineWidth = 2;
      for (let y = top; y < top + gate.h; y += 23) {
        ctx.beginPath();
        ctx.moveTo(gate.x, y);
        ctx.lineTo(gate.x + gate.w, y + 18);
        ctx.stroke();
      }
      ctx.restore();
      ctx.fillStyle = world.gateIsOpen(gate) ? '#c9dc8d' : '#8e9a78';
      ctx.shadowColor = '#c9dc8d';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(gate.x + gate.w / 2, gate.y - 7, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    });

    if (world.crate) this.drawCrate(world.crate);
    if (level.lever) {
      const { x, y } = level.lever;
      ctx.fillStyle = '#28322a';
      ctx.fillRect(x - 17, y - 34, 34, 34);
      ctx.strokeStyle = '#8c967a';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(x, y - 18);
      ctx.lineTo(x + (world.leverActive ? 17 : -17), y - 52);
      ctx.stroke();
      ctx.fillStyle = world.leverActive ? '#d2e29b' : '#a8b48b';
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#d2e29b';
      ctx.beginPath();
      ctx.arc(x + (world.leverActive ? 17 : -17), y - 52, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillRect(x - 5, y - 17, 10, 3);
    }

    this.drawPlayer();

    for (let i = 0; i < 46; i++) {
      const x = noise(i + 8) * level.width + Math.sin(time * 0.16 + i) * 28;
      const y = 140 + noise(i + 90) * 360 + Math.sin(time * 0.22 + i) * 12;
      ctx.fillStyle = `rgba(220,227,195,${0.08 + noise(i) * 0.15})`;
      ctx.beginPath();
      ctx.arc(x, y, 0.6 + noise(i + 2) * 1.1, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    const vignette = ctx.createRadialGradient(width / 2, 310, Math.min(150, width / 3), width / 2, 310, Math.max(460, width * 0.6));
    vignette.addColorStop(0, 'transparent');
    vignette.addColorStop(1, 'rgba(3,8,5,0.65)');
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, width, VIEW_HEIGHT);
    if (world.exposure > 0) {
      ctx.fillStyle = `rgba(168,129,98,${world.exposure * 0.42})`;
      ctx.fillRect(0, 0, width, VIEW_HEIGHT);
    }
    if (world.deathTimer > 0) {
      ctx.fillStyle = `rgba(4,9,6,${clamp(1.2 - world.deathTimer * 0.5, 0, 0.88)})`;
      ctx.fillRect(0, 0, width, VIEW_HEIGHT);
    }
  }

  private drawGround(ground: Rect) {
    const ctx = this.context;
    ctx.fillStyle = '#0b120d';
    ctx.beginPath();
    ctx.moveTo(ground.x, ground.y);
    for (let x = 0; x <= ground.w; x += 12) {
      ctx.lineTo(ground.x + x, ground.y + noise(x + ground.x) * 4);
    }
    ctx.lineTo(ground.x + ground.w, ground.y);
    ctx.lineTo(ground.x + ground.w, ground.y + ground.h);
    ctx.lineTo(ground.x, ground.y + ground.h);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#46503b';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(ground.x, ground.y + 1);
    ctx.lineTo(ground.x + ground.w, ground.y + 1);
    ctx.stroke();
    for (let x = ground.x + 2; x < ground.x + ground.w - 2; x += 9) {
      const height = 3 + noise(x) * (this.world.level.id === 1 ? 5 : 18);
      ctx.strokeStyle = `rgba(44,58,39,${0.4 + noise(x + 3) * 0.5})`;
      ctx.beginPath();
      ctx.moveTo(x, ground.y + 2);
      ctx.quadraticCurveTo(x + 2, ground.y - height / 2, x - 4 + noise(x + 8) * 8, ground.y - height);
      ctx.stroke();
    }
    const depth = ctx.createLinearGradient(0, ground.y, 0, VIEW_HEIGHT);
    depth.addColorStop(0, 'rgba(4,8,5,0)');
    depth.addColorStop(1, '#060a07');
    ctx.fillStyle = depth;
    ctx.fillRect(ground.x, ground.y + 20, ground.w, ground.h);
  }

  private drawCrate(crate: Rect) {
    const ctx = this.context;
    ctx.fillStyle = '#343c2e';
    ctx.fillRect(crate.x, crate.y, crate.w, crate.h);
    ctx.strokeStyle = '#81886b';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(crate.x + 1, crate.y + 1, crate.w - 2, crate.h - 2);
    ctx.strokeRect(crate.x + 5, crate.y + 5, crate.w - 10, crate.h - 10);
    ctx.strokeStyle = '#596448';
    ctx.beginPath();
    ctx.moveTo(crate.x + 5, crate.y + 5);
    ctx.lineTo(crate.x + crate.w - 5, crate.y + crate.h - 5);
    ctx.moveTo(crate.x + crate.w - 5, crate.y + 5);
    ctx.lineTo(crate.x + 5, crate.y + crate.h - 5);
    ctx.stroke();
  }

  private drawPlayer() {
    const ctx = this.context;
    const player = this.world.player;
    const stride = player.grounded && Math.abs(player.vx) > 0 ? Math.sin(this.world.time * 15) * 8 : 2;
    const bob = player.grounded && Math.abs(player.vx) > 0 ? Math.abs(Math.sin(this.world.time * 15)) * 1.5 : 0;
    const glow = ctx.createRadialGradient(player.x + 12, player.y + 20, 4, player.x + 12, player.y + 20, 78);
    glow.addColorStop(0, 'rgba(168,187,126,0.09)');
    glow.addColorStop(1, 'transparent');
    ctx.fillStyle = glow;
    ctx.fillRect(player.x - 70, player.y - 65, 165, 170);

    ctx.save();
    ctx.translate(player.x + player.w / 2, player.y - bob);
    ctx.scale(player.facing, 1);
    ctx.strokeStyle = '#070c08';
    ctx.fillStyle = '#080e09';
    ctx.lineCap = 'round';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(-3, 36);
    ctx.lineTo(-3 + stride, 51);
    ctx.moveTo(3, 36);
    ctx.lineTo(3 - stride, 51);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-7, 20);
    ctx.lineTo(6, 19);
    ctx.lineTo(10, 38);
    ctx.lineTo(-10, 38);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#1c2719';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillStyle = '#080d09';
    ctx.beginPath();
    ctx.ellipse(0, 10, 10, 11, -0.08, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#080d09';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(5, 23);
    ctx.lineTo(8 - stride * 0.7, 34);
    ctx.stroke();
    ctx.fillStyle = '#6f7958';
    ctx.fillRect(3, 20, 5, 2);
    ctx.fillStyle = '#cbd5b2';
    ctx.fillRect(6, 10, 2, 1.4);
    ctx.restore();
  }

  private drawScanners() {
    const ctx = this.context;
    for (const scanner of this.world.level.scanners) {
      const state = scannerState(scanner, this.world.time);
      ctx.strokeStyle = '#1c271e';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(scanner.x, 0);
      ctx.lineTo(scanner.x, scanner.y);
      ctx.stroke();
      if (state.active) {
        const glow = ctx.createLinearGradient(scanner.x, scanner.y, state.target, FLOOR);
        glow.addColorStop(0, 'rgba(213,221,169,0.4)');
        glow.addColorStop(1, 'rgba(213,221,169,0.10)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.moveTo(scanner.x - 3, scanner.y);
        ctx.lineTo(state.target - scanner.width, FLOOR);
        ctx.lineTo(state.target + scanner.width, FLOOR);
        ctx.lineTo(scanner.x + 3, scanner.y);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = 'rgba(221,226,182,0.11)';
        ctx.beginPath();
        ctx.ellipse(state.target, FLOOR, scanner.width, 5, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = '#18231a';
      ctx.fillRect(scanner.x - 16, scanner.y - 12, 32, 18);
      ctx.fillStyle = state.active ? '#d3dda8' : '#5d6c4e';
      ctx.fillRect(scanner.x - 8, scanner.y + 3, 16, 3);
    }
  }

  private drawExit() {
    const ctx = this.context;
    const x = this.world.level.exit;
    const light = ctx.createRadialGradient(x + 25, FLOOR - 58, 3, x + 25, FLOOR - 58, 135);
    light.addColorStop(0, 'rgba(214,226,166,0.19)');
    light.addColorStop(1, 'transparent');
    ctx.fillStyle = light;
    ctx.fillRect(x - 120, FLOOR - 220, 290, 270);
    ctx.fillStyle = '#202b21';
    ctx.fillRect(x - 15, FLOOR - 153, 91, 153);
    ctx.strokeStyle = '#73805e';
    ctx.lineWidth = 2;
    ctx.strokeRect(x - 9, FLOOR - 147, 79, 147);
    const doorway = ctx.createLinearGradient(x, 0, x + 62, 0);
    doorway.addColorStop(0, '#6d7956');
    doorway.addColorStop(0.45, '#c0cc9c');
    doorway.addColorStop(1, '#7f8c66');
    ctx.fillStyle = doorway;
    ctx.fillRect(x, FLOOR - 136, 61, 136);
    ctx.fillStyle = 'rgba(224,235,186,0.16)';
    ctx.beginPath();
    ctx.moveTo(x, FLOOR);
    ctx.lineTo(x - 70, FLOOR + 55);
    ctx.lineTo(x + 100, FLOOR + 55);
    ctx.lineTo(x + 61, FLOOR);
    ctx.fill();
  }

  dispose() {
    cancelAnimationFrame(this.frameId);
    this.resizeObserver.disconnect();
    window.removeEventListener('keydown', this.keyDown);
    window.removeEventListener('keyup', this.keyUp);
    window.removeEventListener('blur', this.clearInput);
    this.clearInput();
    this.canvas.width = 0;
    this.canvas.height = 0;
  }
}