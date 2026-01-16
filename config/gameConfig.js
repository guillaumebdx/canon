export const BRICK_COLORS = {
  5: '#660022',
  4: '#991133',
  3: '#cc2244',
  2: '#ff4466',
  1: '#ffff00',
};

export const BRICK_POINTS = {
  destroy: 20,
  hit: 10,
};

export const BRICK_DEFAULTS = {
  width: 20,
  height: 20,
  gap: 2,
  restitution: 1.0,
  friction: 0.001,
};

export const PHYSICS = {
  gravity: { x: 0, y: 4.0 },
  ball: {
    radius: 3,
    speed: 48,
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
