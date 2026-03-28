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

    // subtle drop shadow under submarine
    ctx.fillStyle = 'rgba(0,20,40,0.18)';
    ctx.beginPath();
    ctx.ellipse(0, 18, 28, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    // body gradient
    const bodyGrad = ctx.createLinearGradient(-24, -13, 24, 13);
    bodyGrad.addColorStop(0, '#ffd66a');
    bodyGrad.addColorStop(0.5, '#ffcf4a');
    bodyGrad.addColorStop(1, '#f2b635');

    // main hull
    ctx.fillStyle = bodyGrad;
    ctx.beginPath();
    ctx.roundRect(-28, -14, 56, 28, 14);
    ctx.fill();

    // darker rim / outline
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'rgba(40,40,40,0.6)';
    ctx.stroke();

    // top highlight
    ctx.beginPath();
    ctx.moveTo(-20, -10);
    ctx.quadraticCurveTo(0, -20, 20, -10);
    ctx.lineTo(20, -6);
    ctx.quadraticCurveTo(0, -14, -20, -6);
    ctx.closePath();
    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    ctx.fill();

    // glass dome
    const domeX = -2;
    const domeY = -10;
    ctx.beginPath();
    ctx.ellipse(domeX, domeY, 8, 8.5, 0, Math.PI, 2 * Math.PI);
    const glassGrad = ctx.createLinearGradient(domeX - 6, domeY - 6, domeX + 6, domeY + 6);
    glassGrad.addColorStop(0, 'rgba(220,245,255,0.95)');
    glassGrad.addColorStop(0.6, 'rgba(180,220,235,0.9)');
    glassGrad.addColorStop(1, 'rgba(140,190,215,0.8)');
    ctx.fillStyle = glassGrad;
    ctx.fill();
    ctx.strokeStyle = 'rgba(60,90,110,0.7)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // small dome highlight
    ctx.beginPath();
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.ellipse(domeX - 3, domeY - 3, 3.2, 1.6, -0.4, 0, Math.PI * 2);
    ctx.fill();

    // portholes
    const portholePositions = [-10, 4, 18];
    portholePositions.forEach((px) => {
      // rim
      ctx.beginPath();
      ctx.fillStyle = 'rgba(90,90,90,0.9)';
      ctx.arc(px, 0, 6, 0, Math.PI * 2);
      ctx.fill();

      // inner glass
      ctx.beginPath();
      const pg = ctx.createLinearGradient(px - 4, -3, px + 4, 3);
      pg.addColorStop(0, '#e9fbff');
      pg.addColorStop(1, '#b8e6f2');
      ctx.fillStyle = pg;
      ctx.arc(px, 0, 4, 0, Math.PI * 2);
      ctx.fill();

      // tiny specular
      ctx.beginPath();
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      ctx.arc(px - 1.6, -1.6, 0.9, 0, Math.PI * 2);
      ctx.fill();
    });

    // tail fin
    ctx.beginPath();
    ctx.fillStyle = '#f2a934';
    ctx.moveTo(26, -6);
    ctx.lineTo(36, -12);
    ctx.lineTo(36, 12);
    ctx.lineTo(26, 6);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(40,40,40,0.5)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // propeller hub
    ctx.save();
    ctx.translate(38, 0);
    ctx.fillStyle = 'rgba(80,80,80,0.95)';
    ctx.beginPath();
    ctx.arc(0, 0, 3.5, 0, Math.PI * 2);
    ctx.fill();

    // three simple blades
    ctx.fillStyle = 'rgba(110,110,110,0.95)';
    for (let i = 0; i < 3; i++) {
      ctx.save();
      ctx.rotate((i / 3) * Math.PI * 2);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(8, -2);
      ctx.lineTo(12, -1);
      ctx.lineTo(8, 2);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
    ctx.restore();

    // small forward light
    ctx.beginPath();
    ctx.fillStyle = 'rgba(255,230,140,0.9)';
    ctx.arc(-32, 0, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}
