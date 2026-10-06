import test from 'node:test';
import assert from 'node:assert/strict';
import { LEVELS } from '../src/game/levels.ts';
import { clamp, overlaps, scannerState, World } from '../src/game/world.ts';
import type { InputState, WorldEvent } from '../src/game/world.ts';

const idle: InputState = { left: false, right: false, jump: false, interact: false };

function advance(world: World, frames: number, input: Partial<InputState> = {}) {
  for (let i = 0; i < frames; i++) world.update(1 / 60, { ...idle, ...input });
}

test('collision detection distinguishes overlap from touching edges', () => {
  const a = { x: 0, y: 0, w: 10, h: 10 };
  assert.equal(overlaps(a, { x: 10, y: 0, w: 5, h: 5 }), false);
  assert.equal(overlaps(a, { x: 9, y: 2, w: 5, h: 5 }), true);
  assert.equal(overlaps(a, { x: 1, y: 1, w: 2, h: 2 }), true);
  assert.equal(clamp(-2, 0, 1), 0);
  assert.equal(clamp(3, 0, 1), 1);
});

test('the player moves at a deterministic speed and stays on the floor', () => {
  const world = new World(LEVELS[0]);
  advance(world, 15, { right: true });
  assert.ok(Math.abs(world.player.x - (115 + 235 / 4)) < 0.00001);
  assert.equal(world.player.y, 486);
  assert.equal(world.player.grounded, true);
});

test('a held jump produces one jump, not repeated automatic jumps', () => {
  const world = new World(LEVELS[0]);
  advance(world, 1, { jump: true });
  assert.ok(world.player.y < 486);
  assert.equal(world.player.grounded, false);
  advance(world, 90, { jump: true });
  assert.equal(world.player.y, 486);
  assert.equal(world.player.grounded, true);
});

test('a crate blocks movement until interaction is held', () => {
  const world = new World(LEVELS[0]);
  advance(world, 120, { right: true });
  assert.equal(world.crate?.x, 330);
  assert.equal(world.player.x, 305);
  advance(world, 12, { right: true, interact: true });
  assert.ok((world.crate?.x ?? 0) > 370);
});

test('leaving the crate on the pressure plate keeps the gate open', () => {
  const world = new World(LEVELS[0]);
  advance(world, 120, { right: true });
  advance(world, 43, { right: true, interact: true });
  advance(world, 90);
  assert.equal(world.plateActive, true);
  assert.equal(world.gateIsOpen(LEVELS[0].gates[0]), true);
  assert.ok(world.gateOpenAmounts[0] > 0.99);
});

test('an unweighted pressure plate closes its gate', () => {
  const world = new World(LEVELS[0]);
  world.player.x = 530;
  advance(world, 1);
  assert.equal(world.plateActive, true);
  world.player.x = 625;
  advance(world, 1);
  assert.equal(world.plateActive, false);
});

test('a closed gate cannot be crossed', () => {
  const world = new World(LEVELS[0]);
  world.player.x = 965;
  advance(world, 60, { right: true });
  assert.equal(world.player.x, LEVELS[0].gates[0].x - world.player.w);
});

test('levers toggle only on a new interaction press', () => {
  const world = new World(LEVELS[1]);
  world.player.x = 355;
  advance(world, 1, { interact: true });
  assert.equal(world.leverActive, true);
  advance(world, 30, { interact: true });
  assert.equal(world.leverActive, true);
  advance(world, 1);
  advance(world, 1, { interact: true });
  assert.equal(world.leverActive, false);
});

test('searchlights have predictable active and inactive periods', () => {
  const scanner = LEVELS[1].scanners[0];
  assert.equal(scannerState(scanner, 0).active, true);
  assert.equal(scannerState(scanner, 8).active, false);
  assert.equal(scannerState(scanner, 9).active, true);
  assert.ok(Math.abs(scannerState(scanner, 2).target - scanner.x) <= scanner.sweep);
});

test('a platform protects a player standing under its cover', () => {
  const world = new World(LEVELS[1]);
  world.player.x = 1370;
  advance(world, 120);
  assert.equal(world.deaths, 0);
  assert.equal(world.exposure, 0);
});

test('remaining exposed to a searchlight triggers a restart', () => {
  const world = new World(LEVELS[1]);
  world.player.x = 1540;
  world.time = 1;
  advance(world, 22);
  assert.equal(world.deaths, 1);
  assert.ok(world.deathTimer > 0);
});

test('falling resets the puzzle and preserves the attempt count', () => {
  const world = new World(LEVELS[0]);
  world.player.x = 735;
  world.player.y = 660;
  advance(world, 180);
  assert.equal(world.deaths, 1);
  assert.equal(world.player.x, LEVELS[0].spawn.x);
  assert.equal(world.crate?.x, LEVELS[0].crate?.x);
});

test('completion fires once after the exit and mechanisms are reached', () => {
  const events: WorldEvent[] = [];
  const world = new World(LEVELS[0], (event) => events.push(event));
  assert.ok(world.crate);
  world.crate.x = 530;
  world.player.x = LEVELS[0].exit - 1;
  advance(world, 10);
  assert.equal(world.finished, true);
  assert.equal(events.filter((event) => event === 'complete').length, 1);
});

test('manual restart clears statistics and puzzle state', () => {
  const world = new World(LEVELS[1]);
  world.leverActive = true;
  world.deaths = 4;
  world.elapsed = 45;
  world.restart();
  assert.equal(world.leverActive, false);
  assert.equal(world.deaths, 0);
  assert.equal(world.elapsed, 0);
  assert.equal(world.player.x, LEVELS[1].spawn.x);
});

test('all chapters have valid mechanisms and reachable world bounds', () => {
  LEVELS.forEach((level, index) => {
    assert.equal(level.id, index);
    assert.ok(level.exit > level.spawn.x && level.exit < level.width);
    level.gates.forEach((gate) => {
      if (gate.requires === 'plate') assert.ok(level.plate && level.crate);
      if (gate.requires === 'lever') assert.ok(level.lever);
    });
    assert.ok(level.ground.some((ground) => level.exit >= ground.x && level.exit <= ground.x + ground.w));
  });
});