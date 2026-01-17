import Matter from 'matter-js';
import { Dimensions } from 'react-native';
import { BRICK_POINTS, PHYSICS } from '../config/gameConfig';

const { width, height } = Dimensions.get('window');

const CATEGORY_BALL = 0x0001;
const CATEGORY_BRICK = 0x0002;
const CATEGORY_WALL = 0x0004;

export class PhysicsEngine {
  constructor() {
    this.engine = Matter.Engine.create({
      enableSleeping: false,
      gravity: PHYSICS.gravity,
    });
    this.world = this.engine.world;
    
    this.isShootingPaused = false;
    
    this.balls = [];
    this.bricks = [];
    this.walls = [];
    this.ballIdCounter = 0;
    this.brickIdCounter = 0;
    
    this.score = 0;
    this.explosions = [];
    this.explosionIdCounter = 0;
    this.bricksDestroyed = 0;
    this.totalBricks = 0;
    this.soundEvents = [];
    this.hapticEvents = [];
    
    this.lastShootTime = 0;
    this.shootInterval = 100;
    
    this.listeners = new Set();
    
    this.createWalls();
    this.setupCollisionHandler();
  }

  setupCollisionHandler() {
    this.processedCollisions = new Set();
    
    Matter.Events.on(this.engine, 'collisionStart', (event) => {
      event.pairs.forEach(pair => {
        const { bodyA, bodyB } = pair;
        
        let ball = null;
        let brick = null;
        
        if (bodyA.label === 'ball' && bodyB.label === 'brick') {
          ball = bodyA;
          brick = bodyB;
        } else if (bodyB.label === 'ball' && bodyA.label === 'brick') {
          ball = bodyB;
          brick = bodyA;
        }
        
        if (brick && ball) {
          const collisionKey = `${ball.ballId}-${brick.brickId}`;
          if (this.processedCollisions.has(collisionKey)) return;
          this.processedCollisions.add(collisionKey);
          
          setTimeout(() => this.processedCollisions.delete(collisionKey), 100);
          
          const previousHealth = brick.brickHealth;
          brick.brickHealth--;
          
          if (brick.brickHealth <= 0) {
            this.score += BRICK_POINTS.destroy;
            this.bricksDestroyed++;
            this.hapticEvents.push('medium');
            this.explosions.push({
              id: this.explosionIdCounter++,
              x: brick.position.x,
              y: brick.position.y,
              health: previousHealth,
            });
            Matter.Composite.remove(this.world, brick);
            this.bricks = this.bricks.filter(b => b !== brick);
          } else {
            this.score += BRICK_POINTS.hit;
            this.hapticEvents.push('light');
          }
        }
      });
    });
  }

  createWalls() {
    const wallOptions = {
      isStatic: true,
      restitution: PHYSICS.wall.restitution,
      friction: PHYSICS.wall.friction,
      collisionFilter: {
        category: CATEGORY_WALL,
        mask: CATEGORY_BALL,
      },
      render: { visible: false },
    };

    const leftWall = Matter.Bodies.rectangle(-25, height / 2, 50, height, wallOptions);
    const rightWall = Matter.Bodies.rectangle(width + 25, height / 2, 50, height, wallOptions);
    const topWall = Matter.Bodies.rectangle(width / 2, -25, width, 50, wallOptions);
    
    this.walls = [leftWall, rightWall, topWall];
    Matter.Composite.add(this.world, this.walls);
  }

  loadLevel(levelConfig) {
    this.clearBricks();
    this.score = 0;
    this.bricksDestroyed = 0;
    this.totalBricks = 0;
    
    if (levelConfig.bricks) {
      levelConfig.bricks.forEach(brickData => {
        this.addBrick(brickData);
        this.totalBricks++;
      });
    }
  }

  addBrick(brickData) {
    const brick = Matter.Bodies.rectangle(
      brickData.x,
      brickData.y,
      brickData.width,
      brickData.height,
      {
        isStatic: true,
        restitution: brickData.restitution || 1.0,
        friction: brickData.friction || 0.001,
        collisionFilter: {
          category: CATEGORY_BRICK,
          mask: CATEGORY_BALL,
        },
        label: 'brick',
        brickId: this.brickIdCounter++,
        brickHealth: brickData.health || 2,
      }
    );
    
    this.bricks.push(brick);
    Matter.Composite.add(this.world, brick);
    return brick;
  }

  clearBricks() {
    this.bricks.forEach(brick => {
      Matter.Composite.remove(this.world, brick);
    });
    this.bricks = [];
    this.brickIdCounter = 0;
  }

  shootBall(cannonX, cannonY, rotationDeg) {
    const angleRad = (rotationDeg - 90) * (Math.PI / 180);
    
    const ball = Matter.Bodies.circle(cannonX, cannonY, PHYSICS.ball.radius, {
      restitution: PHYSICS.ball.restitution,
      friction: PHYSICS.ball.friction,
      frictionAir: PHYSICS.ball.frictionAir,
      density: PHYSICS.ball.density,
      isBullet: true,
      collisionFilter: {
        category: CATEGORY_BALL,
        mask: CATEGORY_BALL | CATEGORY_BRICK | CATEGORY_WALL,
      },
      label: 'ball',
      ballId: this.ballIdCounter++,
    });

    Matter.Body.setVelocity(ball, {
      x: Math.cos(angleRad) * PHYSICS.ball.speed,
      y: Math.sin(angleRad) * PHYSICS.ball.speed,
    });

    this.balls.push(ball);
    Matter.Composite.add(this.world, ball);
    
    return ball;
  }

  pauseShooting() {
    this.isShootingPaused = true;
  }

  resumeShooting() {
    this.isShootingPaused = false;
  }

  update(deltaTime, currentTime, cannonX, cannonY, rotationDeg) {
    const cappedDelta = Math.min(deltaTime, 16.667);
    const substeps = 3;
    const subDelta = cappedDelta / substeps;
    for (let i = 0; i < substeps; i++) {
      Matter.Engine.update(this.engine, subDelta);
    }

    this.cleanupBalls();

    this.notifyListeners();
  }

  cleanupBalls() {
    for (let i = this.balls.length - 1; i >= 0; i--) {
      const ball = this.balls[i];
      if (ball.position.y > height + 100 || 
          ball.position.y < -100 ||
          ball.position.x < -100 || 
          ball.position.x > width + 100) {
        Matter.Composite.remove(this.world, ball);
        this.balls.splice(i, 1);
      }
    }
  }

  getBallsState() {
    const result = new Array(this.balls.length);
    for (let i = 0; i < this.balls.length; i++) {
      const ball = this.balls[i];
      result[i] = {
        id: ball.ballId,
        x: Math.round(ball.position.x),
        y: Math.round(ball.position.y),
      };
    }
    return result;
  }

  getBricksState() {
    const result = new Array(this.bricks.length);
    for (let i = 0; i < this.bricks.length; i++) {
      const brick = this.bricks[i];
      result[i] = {
        id: brick.brickId,
        x: brick.position.x,
        y: brick.position.y,
        width: brick.bounds.max.x - brick.bounds.min.x,
        height: brick.bounds.max.y - brick.bounds.min.y,
        health: brick.brickHealth,
      };
    }
    return result;
  }

  getScore() {
    return this.score;
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  getExplosions() {
    const explosions = [...this.explosions];
    this.explosions = [];
    return explosions;
  }

  notifyListeners() {
    const state = {
      balls: this.getBallsState(),
      bricks: this.getBricksState(),
      score: this.score,
      explosions: this.getExplosions(),
      bricksDestroyed: this.bricksDestroyed,
      totalBricks: this.totalBricks,
      soundEvents: [...this.soundEvents],
      hapticEvents: [...this.hapticEvents],
    };
    this.soundEvents = [];
    this.hapticEvents = [];
    this.listeners.forEach(listener => listener(state));
  }

  destroy() {
    Matter.Engine.clear(this.engine);
    Matter.World.clear(this.world);
    this.balls = [];
    this.bricks = [];
    this.listeners.clear();
  }
}
