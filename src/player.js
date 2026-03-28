window.Player = class Player {
  constructor(x, y) {
    this.position = { x, y };
    this.velocity = { x: 0, y: 0 };
    this.width = 58;
    this.height = 30;
    this.speed = 240;
  }

  update(deltaTime, keys, world) {
    let moveX = 0;
    let moveY = 0;

    if (keys.has("arrowleft") || keys.has("a")) {
      moveX -= 1;
    }
    if (keys.has("arrowright") || keys.has("d")) {
      moveX += 1;
    }
    if (keys.has("arrowup") || keys.has("w")) {
      moveY -= 1;
    }
    if (keys.has("arrowdown") || keys.has("s")) {
      moveY += 1;
    }

    const magnitude = Math.hypot(moveX, moveY) || 1;
    this.velocity.x = (moveX / magnitude) * this.speed;
    this.velocity.y = (moveY / magnitude) * this.speed;

    this.position.x += this.velocity.x * deltaTime;
    this.position.y += this.velocity.y * deltaTime;

    this.position.x = Math.max(32, Math.min(world.width - 32, this.position.x));
    this.position.y = Math.max(32, Math.min(world.height - 32, this.position.y));
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.position.x, this.position.y);

    const isFacingLeft = this.velocity.x < -3;
    if (isFacingLeft) {
      ctx.scale(-1, 1);
    }

    ctx.fillStyle = "#ffd479";
    ctx.beginPath();
    ctx.roundRect(-24, -13, 40, 26, 13);
    ctx.fill();

    ctx.fillStyle = "#0f5372";
    ctx.beginPath();
    ctx.arc(-4, 0, 8, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#ff9d4d";
    ctx.beginPath();
    ctx.moveTo(16, -7);
    ctx.lineTo(30, 0);
    ctx.lineTo(16, 7);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "#e9fbff";
    ctx.beginPath();
    ctx.arc(-6, -1, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "rgba(255,255,255,0.65)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-21, 0);
    ctx.lineTo(-10, 0);
    ctx.stroke();

    ctx.restore();
  }
}
