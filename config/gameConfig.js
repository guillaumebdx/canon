export const BRICK_COLORS = {
  2: '#ff4466',
  1: '#ffaa44',
};

export const BRICK_POINTS = {
  destroy: 20,
  hit: 10,
};

export const BRICK_DEFAULTS = {
  width: 40,
  height: 20,
  gap: 4,
  restitution: 1.0,
  friction: 0.001,
};

export const PHYSICS = {
  gravity: { x: 0, y: 4.0 },
  ball: {
    radius: 6,
    speed: 60,
    restitution: 1.0,
    friction: 0.001,
    frictionAir: 0.0001,
    density: 0.002,
  },
  wall: {
    restitution: 1.0,
    friction: 0.001,
  },
};
