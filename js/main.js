const CONFIG = {
  frameRate: 50,
  duration: 10,
  gif: true,
  record: false,
  width: 600,
  height: 600,
  clearScreen: true,
  animate: true,
  interations: 100,
};

class ExplosionParticle {
  constructor(x, y, color) {
    this.position = createVector(x, y);
    this.velocity = p5.Vector.random2D();
    this.velocity.mult(getRandomRange(3, 9));
    this.color = color;
    this.dampening = 0.99;
    this.size = getRandomRange(12, 20);
    this.particleType = Math.round(getRandomRange(1, 3));
  }

  update() {
    this.position.add(this.velocity);

    this.velocity.mult(this.dampening);
    this.size -= 0.5;
  }

  display() {
    const size = Math.round(this.size);

    if (size >= 1) {
      fill(`rgb(${this.color.r}, ${this.color.g}, ${this.color.b})`);
      noStroke();
      if (this.particleType == 1) {
        rect(this.position.x, this.position.y, Math.round(this.size));
      } else if (this.particleType == 2) {
        ellipse(this.position.x, this.position.y, Math.round(this.size));
      } else {
        stroke(`rgb(${this.color.r}, ${this.color.g}, ${this.color.b})`);
        noFill();
        line(this.position.x, this.position.y, this.position.x + getRandomRange(-this.size, this.size), this.position.y + getRandomRange(-this.size, this.size));
      }
    }
  }
}

class Explosion {
  constructor(x, y, color) {
    this.count = getRandomRange(60, 90);
    this.lifeTime = getRandomRange(30, 45);
    this.color = color;
    this.particles = [];

    for (let i = 0; i < this.count; i++) {
      this.particles.push(new ExplosionParticle(x, y, color));
    }
  }

  dead() {
    return this.lifeTime <= 0;
  }

  update() {
    this.lifeTime--;

    for (let particle of this.particles) {
      particle.update();
    }
  }

  display() {
    push();
    let color = `rgb(${this.color.r}, ${this.color.g}, ${this.color.b})`;
    drawingContext.shadowBlur = 25;
    drawingContext.shadowColor = color;

    for (let particle of this.particles) {
      particle.display();
    }
    pop();
  }
}

class Particle {
  constructor(x, y, mass = 1, color) {
    this.position = createVector(x, y);
    this.velocity = p5.Vector.random2D();
    this.velocity.mult(getRandomRange(1, 2));
    this.acceleration = createVector();
    this.mass = mass;
    this.radius = 30;
    this.lifeTime = getRandomRange(20, 35);
    this.color = color;
  }

  update() {
    this.velocity.add(this.acceleration);
    this.position.add(this.velocity);
    if (this.edgeCheck) this.checkEdges();

    this.acceleration.mult(0);
    this.lifeTime -= 1;
  }

  applyForce(force) {
    const f = p5.Vector.div(force, this.mass);

    this.acceleration.add(f);
  }

  dead() {
    return this.lifeTime <= 0;
  }

  getSize() {
    return map(this.lifeTime, 0, 35, 1, 30);
  }

  display() {
    fill(`rgba(${this.color.r}, ${this.color.g}, ${this.color.b}, ${this.lifeTime})`);
    ellipse(this.position.x, this.position.y, this.getSize());
  }
}

class Emitter {
  constructor(x, y) {
    this.velocity = p5.Vector.random2D();
    this.velocity.mult(getRandomRange(5, 7));
    this.acceleration = createVector(0, 0);
    this.position = createVector(x, y);
    this.particles = [];
    this.force = createVector(0, 0);
    this.color = random(COLORS);
    this.exploded = false;
    this.radius = getRandomRange(10, 25);
  }

  emit(count) {
    for (let i = 0; i < count; i++) {
      this.particles.push(new Particle(this.position.x, this.position.y, 1, this.color));
    }
    this.emitted = true;
  }

  applyForce(force) {
    if (!this.exploded) {
      this.acceleration.add(force);
  
      const particleForce = force.copy().mult(-1);
      for (let particle of this.particles) {
        particle.applyForce(particleForce);
      }
    }
  }

  wrapEdges() {
    if (this.position.x > width) {
      this.position = createVector(0, this.position.y);
    }
    if (this.position.x < 0) {
      this.position = createVector(width, this.position.y);
    }
    if (this.position.y > height) {
      this.position = createVector(this.position.x, 0);
    }
    if (this.position.y < 0) {
      this.position = createVector(this.position.x, height);
    }
  }

  collides(mover) {
    let dx = mover.position.x - this.position.x;
    let dy = mover.position.y - this.position.y;
    let distance = Math.sqrt(dx * dx + dy * dy);

    return distance <= this.radius;
  }

  explode() {
    this.exploded = true;
    explosions.push(new Explosion(this.position.x, this.position.y, this.color));
  }

  dead() {
    return this.particles.length <= 0 && this.exploded;
  }

  update() {
    if (!this.exploded) {
      this.velocity.add(this.acceleration);
      this.position.add(this.velocity);
      this.acceleration.mult(0);
    }

    for (let particle of this.particles) {
      particle.update();
    }
  
    this.particles = this.particles.filter(p => !p.dead());
  }

  display() {
    if (!this.exploded) {
      fill(`rgb(${this.color.r}, ${this.color.g}, ${this.color.b})`);
      circle(this.position.x, this.position.y, this.radius);
    }

    for (let particle of this.particles) {
      particle.display();
    }
  }
}

let emitters = [];
let emitterCount = 10;

let explosions = [];

const COLORS = [
  {r: 57, g: 212, b: 203},
  {r: 57, g: 135, b: 203},
  {r: 57, g: 212, b: 121},
  {r: 178, g: 117, b: 203}
];

let getRandomNumber;
let getRandomRange;

function setup() {
  frameRate(CONFIG.frameRate);
  createCanvas(CONFIG.width, CONFIG.height);
  if (!CONFIG.clearScreen) {
    background(0);
  }

  getRandomNumber = (max) => Math.floor(Math.random() * max);
  getRandomRange = (min, max) => Math.random() * (max - min) + min;

  for (let i = 0; i < emitterCount; i++) {
    emitters.push(new Emitter(getRandomNumber(width), getRandomNumber(height)));
  }

  if (CONFIG.record) {
    frameRate(CONFIG.frameRate);
    createLoop({ duration: CONFIG.duration, gif: CONFIG.gif });
  }
}

function draw() {
  clear();
  if (CONFIG.clearScreen) {
    background(30);
  }

  blendMode(DODGE);

  const mouse = createVector(mouseX, mouseY);

  for (let i = 0; i < emitters.length; i++) {
    const currentEmiter = emitters[i];
    for (let j = i + 1; j < emitters.length; j++) {
      const nextEmitter = emitters[j];

      if (currentEmiter.exploded || nextEmitter.exploded) continue;

      if (currentEmiter.collides(nextEmitter)) {
        currentEmiter.explode();
        nextEmitter.explode();
      }
    }

    if (!currentEmiter.exploded) {
      currentEmiter.emit(1);
      currentEmiter.wrapEdges();
    }

    currentEmiter.update();
    currentEmiter.display();
  }

  for (let explosion of explosions) {
    explosion.update();
    explosion.display();
  }

  if (emitters.length < emitterCount) {
    emitters.push(new Emitter(getRandomNumber(width), getRandomNumber(height)));
  }

  emitters = emitters.filter(emitter => !emitter.dead());
  explosions = explosions.filter(explosion => !explosion.dead());

  // Still image
  if (!CONFIG.animate) {
    noLoop();

    for (let i = 0; i < CONFIG.interations; i++) {
      
    }
  }
}
