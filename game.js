const gameState = {
    mode: null,
    started: false,
    score: 0,
    discoveredFish: new Set(),
    currentSpecies: [],
    keys: {},
    activeFishId: null,
    gameOver: false,
    bubbles: [],
    notificationTimeout: null,
    postModalNotification: null,
    rescueDragStart: null,
    rescueSliceTimeout: null,
    imageCache: {},
    imageRequestToken: 0,
    camera: {
        x: 0,
        y: 0
    }
};

let canvas;
let ctx;

const submarine = {
    x: 100,
    y: 100,
    width: 54,
    height: 28,
    vx: 0,
    vy: 0,
    angle: 0
};

const fish = [];
const STATION_PHASES = ["learning", "multiple", "free"];
document.addEventListener("DOMContentLoaded", () => {
    initializeGame();
    setupEventListeners();
    renderSpeciesList();
    updateStats();
    startGame();
    gameLoop();
});

function initializeGame() {
    canvas = document.getElementById("gameCanvas");
    ctx = canvas.getContext("2d");
    canvas.width = GAME_CONFIG.canvasWidth;
    canvas.height = GAME_CONFIG.canvasHeight;
    document.getElementById("totalFish").textContent = TOTAL_SPECIES_PER_GAME;

    if (!gameState.bubbles.length) {
        createBubbles();
    }
}

function createBubbles() {
    gameState.bubbles.length = 0;
    for (let i = 0; i < 70; i += 1) {
        gameState.bubbles.push({
            x: Math.random() * GAME_CONFIG.mapWidth,
            y: Math.random() * GAME_CONFIG.mapHeight,
            radius: 2 + Math.random() * 6,
            speed: 0.4 + Math.random() * 1.1,
            drift: (Math.random() - 0.5) * 0.7,
            wobble: Math.random() * Math.PI * 2,
            shimmer: 0.3 + Math.random() * 0.7
        });
    }
}

function setupEventListeners() {
    document.addEventListener("keydown", (event) => {
        gameState.keys[event.key] = true;

        if (!event.repeat && (event.key === "e" || event.key === "E" || event.key === "f" || event.key === "F")) {
            inspectNearestFish();
        }
    });

    document.addEventListener("keyup", (event) => {
        gameState.keys[event.key] = false;
    });

    canvas.addEventListener("click", handleCanvasClick);
    document.querySelector(".close").addEventListener("click", closeGuessModal);
    document.getElementById("submitGuess").addEventListener("click", submitGuess);
    document.getElementById("guessInput").addEventListener("keypress", (event) => {
        if (event.key === "Enter") {
            submitGuess();
        }
    });

    document.getElementById("learningNextBtn").addEventListener("click", handleLearningContinue);
    document.getElementById("nextBtn").addEventListener("click", handleResultContinue);
    document.getElementById("restartBtn").addEventListener("click", showStartScreen);
    document.getElementById("pollutionInfoBtn").addEventListener("click", closePollutionInfoOverlay);
    document.getElementById("rescueOverlay").addEventListener("pointerdown", beginRescueSlice);
    document.getElementById("rescueOverlay").addEventListener("pointermove", trackRescueSlice);
    document.getElementById("rescueOverlay").addEventListener("pointerup", endRescueSlice);
    document.getElementById("rescueOverlay").addEventListener("pointercancel", endRescueSlice);

    document.getElementById("guessModal").addEventListener("click", (event) => {
        if (event.target.id === "guessModal") {
            closeGuessModal();
        }
    });

}

function startGame() {
    gameState.mode = "progressive";
    gameState.started = true;
    gameState.gameOver = false;
    gameState.score = 0;
    gameState.activeFishId = null;
    gameState.discoveredFish.clear();
    gameState.currentSpecies = getRandomSpeciesSelection();
    resetSubmarine();
    resetFish();
    syncModeUi();
    updateStats();
    renderSpeciesList();
    resetEncounterPanels();
    closeGuessModal();
    document.getElementById("gameOverModal").classList.add("hidden");
    prefetchSpeciesImages();
    showNotification("Explore the reef. Every station starts in learning mode, then relocates into multiple choice and free response.");
}

function showStartScreen() {
    startGame();
}

function resetSubmarine() {
    submarine.x = 140;
    submarine.y = 140;
    submarine.vx = 0;
    submarine.vy = 0;
    submarine.angle = 0;
    updateCamera();
}

function getRandomSpeciesSelection() {
    const pool = [...FISH_DATABASE];
    shuffleArray(pool);
    return pool.slice(0, TOTAL_SPECIES_PER_GAME);
}

function resetFish() {
    fish.length = 0;
    const positions = generateFishPositions(gameState.currentSpecies.length);

    gameState.currentSpecies.forEach((species, index) => {
        fish.push({
            id: species.id,
            data: species,
            x: positions[index].x,
            y: positions[index].y,
            discovered: false,
            phase: STATION_PHASES[0],
            radius: 22,
            pulseOffset: Math.random() * Math.PI * 2,
            needsRescue: Math.random() < 0.1,
            rescueComplete: false,
            pollutionInfoSeen: false
        });
    });

    document.getElementById("totalFish").textContent = gameState.currentSpecies.length;
}

function generateFishPositions(count) {
    const positions = [];
    let attempts = 0;

    while (positions.length < count && attempts < count * 300) {
        const candidate = {
            x: 120 + Math.random() * (GAME_CONFIG.mapWidth - 240),
            y: 120 + Math.random() * (GAME_CONFIG.mapHeight - 240)
        };

        const farEnoughFromOthers = positions.every(
            (position) => Math.hypot(position.x - candidate.x, position.y - candidate.y) > 105
        );
        const farEnoughFromSpawn = Math.hypot(candidate.x - 140, candidate.y - 140) > 200;

        if (farEnoughFromOthers && farEnoughFromSpawn) {
            positions.push(candidate);
        }

        attempts += 1;
    }

    while (positions.length < count) {
        positions.push({
            x: 180 + (positions.length % 5) * 360,
            y: 180 + Math.floor(positions.length / 5) * 260
        });
    }

    return positions;
}

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

function update() {
    if (!gameState.started || gameState.gameOver) {
        updateHud();
        return;
    }

    submarine.vx = 0;
    submarine.vy = 0;

    if (gameState.keys.ArrowUp || gameState.keys.w || gameState.keys.W) submarine.vy = -GAME_CONFIG.submarineSpeed;
    if (gameState.keys.ArrowDown || gameState.keys.s || gameState.keys.S) submarine.vy = GAME_CONFIG.submarineSpeed;
    if (gameState.keys.ArrowLeft || gameState.keys.a || gameState.keys.A) submarine.vx = -GAME_CONFIG.submarineSpeed;
    if (gameState.keys.ArrowRight || gameState.keys.d || gameState.keys.D) submarine.vx = GAME_CONFIG.submarineSpeed;

    submarine.x += submarine.vx;
    submarine.y += submarine.vy;

    if (submarine.vx !== 0 || submarine.vy !== 0) {
        submarine.angle = Math.atan2(submarine.vy, submarine.vx);
    }

    submarine.x = Math.max(22, Math.min(submarine.x, GAME_CONFIG.mapWidth - submarine.width - 20));
    submarine.y = Math.max(36, Math.min(submarine.y, GAME_CONFIG.mapHeight - submarine.height - 28));

    updateBubbles();
    updateCamera();
    updateHud();
}

function updateBubbles() {
    gameState.bubbles.forEach((bubble) => {
        bubble.y -= bubble.speed;
        bubble.x += bubble.drift + Math.sin(Date.now() / 900 + bubble.wobble) * 0.18;

        if (bubble.y + bubble.radius < 0) {
            bubble.y = GAME_CONFIG.mapHeight + bubble.radius;
            bubble.x = Math.random() * GAME_CONFIG.mapWidth;
            bubble.wobble = Math.random() * Math.PI * 2;
        }

        if (bubble.x < -10) bubble.x = GAME_CONFIG.mapWidth + 10;
        if (bubble.x > GAME_CONFIG.mapWidth + 10) bubble.x = -10;
    });
}

function draw() {
    drawOcean();
    drawLightRays();
    drawBubbles();
    drawDepthLines();
    drawCaustics();
    drawSeabed();
    drawSeabedDecor();

    fish.forEach((fishEntry) => {
        if (!fishEntry.discovered) {
            drawFish(fishEntry);
        }
    });

    if (gameState.started) {
        drawSubmarine();
        drawGuideArrow();
    }
}

function drawOcean() {
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, "#1f7790");
    gradient.addColorStop(0.2, "#185f79");
    gradient.addColorStop(0.48, "#0d445b");
    gradient.addColorStop(0.72, "#082a3d");
    gradient.addColorStop(1, "#03131f");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const lightGradient = ctx.createRadialGradient(canvas.width * 0.35, 45, 20, canvas.width * 0.35, 45, 340);
    lightGradient.addColorStop(0, "rgba(214,247,255,0.25)");
    lightGradient.addColorStop(0.35, "rgba(135,223,255,0.12)");
    lightGradient.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = lightGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const cyanBloom = ctx.createRadialGradient(canvas.width * 0.7, canvas.height * 0.3, 30, canvas.width * 0.7, canvas.height * 0.3, 280);
    cyanBloom.addColorStop(0, "rgba(84, 220, 255, 0.08)");
    cyanBloom.addColorStop(1, "rgba(84, 220, 255, 0)");
    ctx.fillStyle = cyanBloom;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const offsetX = -gameState.camera.x * 0.08;
    const offsetY = -gameState.camera.y * 0.05;

    ctx.strokeStyle = "rgba(235,248,255,0.045)";
    ctx.lineWidth = 2;
    for (let i = -1; i < 7; i += 1) {
        const waveY = 80 + i * 90 + (offsetY % 90);
        ctx.beginPath();
        for (let x = -40; x <= canvas.width + 40; x += 30) {
            const y = waveY + Math.sin((x + offsetX) / 70) * 8 + Math.cos((x + offsetX) / 150) * 4;
            if (x === -40) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        ctx.stroke();
    }
}

function drawLightRays() {
    ctx.save();
    ctx.globalCompositeOperation = "screen";

    const baseOffset = (gameState.camera.x * 0.12 + Date.now() * 0.01) % 220;
    for (let i = -1; i < 5; i += 1) {
        const x = i * 190 - baseOffset;
        const rayGradient = ctx.createLinearGradient(x, 0, x + 150, canvas.height);
        rayGradient.addColorStop(0, "rgba(215, 244, 255, 0.16)");
        rayGradient.addColorStop(0.25, "rgba(135, 223, 255, 0.08)");
        rayGradient.addColorStop(1, "rgba(135, 223, 255, 0)");
        ctx.fillStyle = rayGradient;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x + 120, 0);
        ctx.lineTo(x + 230, canvas.height);
        ctx.lineTo(x + 60, canvas.height);
        ctx.closePath();
        ctx.fill();
    }

    ctx.restore();
}

function drawBubbles() {
    gameState.bubbles.forEach((bubble) => {
        const screenX = bubble.x - gameState.camera.x;
        const screenY = bubble.y - gameState.camera.y;

        if (screenX < -20 || screenX > canvas.width + 20 || screenY < -20 || screenY > canvas.height + 20) {
            return;
        }

        const glow = bubble.radius * 2.2;
        const bubbleGradient = ctx.createRadialGradient(
            screenX - bubble.radius * 0.35,
            screenY - bubble.radius * 0.45,
            0,
            screenX,
            screenY,
            glow
        );
        bubbleGradient.addColorStop(0, `rgba(245, 253, 255, ${0.22 * bubble.shimmer})`);
        bubbleGradient.addColorStop(0.45, `rgba(182, 237, 255, ${0.13 * bubble.shimmer})`);
        bubbleGradient.addColorStop(1, "rgba(182, 237, 255, 0)");
        ctx.fillStyle = bubbleGradient;
        ctx.beginPath();
        ctx.arc(screenX, screenY, glow, 0, Math.PI * 2);
        ctx.fill();

        ctx.beginPath();
        ctx.arc(screenX, screenY, bubble.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(210, 245, 255, ${0.12 + bubble.shimmer * 0.12})`;
        ctx.fill();
        ctx.strokeStyle = `rgba(231, 250, 255, ${0.26 + bubble.shimmer * 0.2})`;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(screenX - bubble.radius * 0.28, screenY - bubble.radius * 0.32, Math.max(1, bubble.radius * 0.22), 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255,255,255,0.42)";
        ctx.fill();
    });
}

function drawDepthLines() {
    ctx.strokeStyle = "rgba(120, 236, 255, 0.07)";
    ctx.lineWidth = 1;

    const startY = -(gameState.camera.y % 70);
    for (let y = startY; y < canvas.height; y += 70) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
    }

    const startX = -(gameState.camera.x % 80);
    for (let x = startX; x < canvas.width; x += 80) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
    }
}

function drawCaustics() {
    ctx.save();
    ctx.globalAlpha = 0.32;
    ctx.strokeStyle = "rgba(168, 240, 255, 0.08)";
    ctx.lineWidth = 3;

    const phaseX = gameState.camera.x * 0.2;
    const phaseY = gameState.camera.y * 0.18;
    for (let band = -1; band < 6; band += 1) {
        const baseY = 140 + band * 120 - (phaseY % 120);
        ctx.beginPath();
        for (let x = -30; x <= canvas.width + 30; x += 18) {
            const y = baseY + Math.sin((x + phaseX) / 42) * 7 + Math.cos((x + phaseX) / 88) * 9;
            if (x === -30) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        ctx.stroke();
    }

    ctx.restore();
}

function drawSeabed() {
    const seabedGradient = ctx.createLinearGradient(0, canvas.height - 170, 0, canvas.height);
    seabedGradient.addColorStop(0, "#123447");
    seabedGradient.addColorStop(0.45, "#0b2433");
    seabedGradient.addColorStop(1, "#061722");
    ctx.fillStyle = seabedGradient;
    ctx.beginPath();
    ctx.moveTo(0, canvas.height);
    for (let x = -40; x <= canvas.width + 40; x += 40) {
        const worldX = x + gameState.camera.x;
        const y = getSeabedY(worldX) - gameState.camera.y;
        ctx.lineTo(x, y);
    }
    ctx.lineTo(canvas.width, canvas.height);
    ctx.lineTo(0, canvas.height);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = "rgba(162, 220, 236, 0.08)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let x = -40; x <= canvas.width + 40; x += 24) {
        const worldX = x + gameState.camera.x;
        const y = getSeabedY(worldX) - gameState.camera.y;
        if (x === -40) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    }
    ctx.stroke();
}

function drawSeabedDecor() {
    const startX = Math.floor(gameState.camera.x / 120) * 120 - 120;

    for (let worldX = startX; worldX < gameState.camera.x + canvas.width + 120; worldX += 120) {
        const screenX = worldX - gameState.camera.x;
        const baseY = getSeabedY(worldX) - gameState.camera.y;

        if (baseY > canvas.height + 40 || baseY < canvas.height - 230) {
            continue;
        }

        drawRockCluster(screenX, baseY, worldX);
        drawSeaweedPatch(screenX, baseY, worldX);
    }
}

function drawRockCluster(screenX, baseY, worldX) {
    const rockCount = 2 + (Math.abs(Math.floor(worldX / 120)) % 3);

    for (let i = 0; i < rockCount; i += 1) {
        const offsetX = (i - 1) * 16 + Math.sin(worldX * 0.03 + i) * 6;
        const rockW = 16 + ((worldX + i * 17) % 12);
        const rockH = 10 + ((worldX + i * 23) % 10);
        ctx.fillStyle = i % 2 === 0 ? "rgba(24, 53, 66, 0.95)" : "rgba(37, 70, 85, 0.9)";
        ctx.beginPath();
        ctx.ellipse(screenX + offsetX, baseY - rockH * 0.4, rockW, rockH, 0.12, 0, Math.PI * 2);
        ctx.fill();
    }
}

function drawSeaweedPatch(screenX, baseY, worldX) {
    const bladeCount = 3 + (Math.abs(Math.floor(worldX / 60)) % 4);

    for (let i = 0; i < bladeCount; i += 1) {
        const rootX = screenX - 28 + i * 11;
        const height = 24 + ((worldX + i * 13) % 34);
        const sway = Math.sin(Date.now() / 900 + worldX * 0.015 + i) * 7;

        ctx.strokeStyle = i % 2 === 0 ? "rgba(61, 129, 106, 0.78)" : "rgba(92, 164, 118, 0.72)";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(rootX, baseY + 4);
        ctx.bezierCurveTo(
            rootX + sway * 0.2,
            baseY - height * 0.35,
            rootX + sway,
            baseY - height * 0.7,
            rootX + sway * 0.55,
            baseY - height
        );
        ctx.stroke();
    }
}

function drawSubmarine() {
    const x = submarine.x - gameState.camera.x;
    const y = submarine.y - gameState.camera.y;
    const centerX = x + submarine.width / 2;
    const centerY = y + submarine.height / 2;
    const time = Date.now() / 300;
    const bob = Math.sin(time * 0.3) * 1.5;

    ctx.save();
    ctx.translate(centerX, centerY + bob);
    ctx.rotate(submarine.angle);
    ctx.translate(-submarine.width / 2, -submarine.height / 2);

    ctx.save();
    ctx.globalAlpha = 0.12;
    const spotGrad = ctx.createLinearGradient(submarine.width * 0.7, submarine.height / 2, submarine.width * 0.7 + 100, submarine.height / 2);
    spotGrad.addColorStop(0, "rgba(180, 240, 255, 1)");
    spotGrad.addColorStop(1, "rgba(180, 240, 255, 0)");
    ctx.fillStyle = spotGrad;
    ctx.beginPath();
    ctx.moveTo(submarine.width * 0.7, submarine.height / 2 - 3);
    ctx.lineTo(submarine.width * 0.7 + 100, submarine.height / 2 - 18);
    ctx.lineTo(submarine.width * 0.7 + 100, submarine.height / 2 + 18);
    ctx.lineTo(submarine.width * 0.7, submarine.height / 2 + 3);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    ctx.shadowColor = "rgba(255, 209, 102, 0.5)";
    ctx.shadowBlur = 22;
    ctx.shadowOffsetY = 2;

    const bodyGrad = ctx.createLinearGradient(0, 0, 0, submarine.height);
    bodyGrad.addColorStop(0, "#ffe08a");
    bodyGrad.addColorStop(0.4, "#ffd166");
    bodyGrad.addColorStop(1, "#e6a82e");
    ctx.fillStyle = bodyGrad;
    ctx.beginPath();
    ctx.ellipse(submarine.width / 2, submarine.height / 2, submarine.width / 2, submarine.height / 2, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;

    ctx.save();
    ctx.globalAlpha = 0.35;
    ctx.fillStyle = "#fff6d5";
    ctx.beginPath();
    ctx.ellipse(submarine.width / 2 - 4, submarine.height * 0.28, submarine.width * 0.32, submarine.height * 0.18, -0.15, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.fillStyle = "#c98e1a";
    ctx.beginPath();
    ctx.arc(submarine.width / 2 + 8, submarine.height / 2, 9, 0, Math.PI * 2);
    ctx.fill();

    const glassGrad = ctx.createRadialGradient(submarine.width / 2 + 6, submarine.height / 2 - 2, 1, submarine.width / 2 + 8, submarine.height / 2, 7);
    glassGrad.addColorStop(0, "#c8f8ff");
    glassGrad.addColorStop(0.6, "#5ee4ff");
    glassGrad.addColorStop(1, "#2ab5d4");
    ctx.fillStyle = glassGrad;
    ctx.beginPath();
    ctx.arc(submarine.width / 2 + 8, submarine.height / 2, 7, 0, Math.PI * 2);
    ctx.fill();

    ctx.save();
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(submarine.width / 2 + 6, submarine.height / 2 - 2, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    const towerGrad = ctx.createLinearGradient(submarine.width / 2 - 5, -14, submarine.width / 2 + 10, -14);
    towerGrad.addColorStop(0, "#ffd166");
    towerGrad.addColorStop(1, "#e6a82e");
    ctx.fillStyle = towerGrad;
    ctx.beginPath();
    ctx.roundRect(submarine.width / 2 - 5, -10, 14, 14, [3, 3, 0, 0]);
    ctx.fill();

    ctx.strokeStyle = "#c98e1a";
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(submarine.width / 2 + 1, -10);
    ctx.lineTo(submarine.width / 2 + 1, -18);
    ctx.lineTo(submarine.width / 2 + 8, -18);
    ctx.stroke();

    ctx.save();
    ctx.translate(submarine.width - 2, submarine.height / 2);
    ctx.rotate(time * 3);
    ctx.fillStyle = "#b58216";
    for (let blade = 0; blade < 3; blade += 1) {
        ctx.save();
        ctx.rotate((blade * Math.PI * 2) / 3);
        ctx.beginPath();
        ctx.ellipse(0, -6, 2, 5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
    ctx.restore();

    const tailGrad = ctx.createLinearGradient(submarine.width - 14, 2, submarine.width - 14, submarine.height - 2);
    tailGrad.addColorStop(0, "#f4a81e");
    tailGrad.addColorStop(1, "#e08c16");
    ctx.fillStyle = tailGrad;
    ctx.beginPath();
    ctx.moveTo(submarine.width - 4, submarine.height / 2);
    ctx.lineTo(submarine.width - 14, 2);
    ctx.lineTo(submarine.width - 14, submarine.height - 2);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
}

function drawGuideArrow() {
    const nearest = getNearestUndiscoveredFish();

    if (!nearest || nearest.distance <= GAME_CONFIG.interactionDistance) {
        return;
    }

    const submarineCenterX = submarine.x + submarine.width / 2 - gameState.camera.x;
    const submarineCenterY = submarine.y + submarine.height / 2 - gameState.camera.y;
    const angle = Math.atan2(nearest.fishEntry.y - (submarine.y + submarine.height / 2), nearest.fishEntry.x - (submarine.x + submarine.width / 2));
    const pulse = 1 + Math.sin(Date.now() / 220) * 0.08;

    ctx.save();
    ctx.translate(
        submarineCenterX + Math.cos(angle) * 54,
        submarineCenterY + Math.sin(angle) * 54
    );
    ctx.rotate(angle);
    ctx.scale(pulse, pulse);

    ctx.strokeStyle = "rgba(122, 231, 255, 0.92)";
    ctx.fillStyle = "rgba(122, 231, 255, 0.92)";
    ctx.lineWidth = 3;
    ctx.shadowColor = "rgba(122, 231, 255, 0.45)";
    ctx.shadowBlur = 18;

    ctx.beginPath();
    ctx.moveTo(-18, 0);
    ctx.lineTo(8, 0);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(18, 0);
    ctx.lineTo(2, -11);
    ctx.lineTo(2, 11);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
}

function drawFish(fishEntry) {
    const centerX = fishEntry.x - gameState.camera.x;
    const centerY = fishEntry.y - gameState.camera.y;
    const pulse = (Math.sin(Date.now() / 280 + fishEntry.pulseOffset) + 1) / 2;
    const distance = getDistanceToSubmarine(fishEntry);
    const nearby = gameState.started && distance < GAME_CONFIG.interactionDistance;

    if (centerX < -40 || centerX > canvas.width + 40 || centerY < -40 || centerY > canvas.height + 40) {
        return;
    }

    ctx.beginPath();
    ctx.arc(centerX, centerY, fishEntry.radius + pulse * 3, 0, Math.PI * 2);
    ctx.fillStyle = nearby ? "rgba(120, 236, 255, 0.20)" : "rgba(255, 255, 255, 0.06)";
    ctx.fill();

    ctx.beginPath();
    ctx.arc(centerX, centerY, fishEntry.radius, 0, Math.PI * 2);
    ctx.fillStyle = nearby ? "#0d2d40" : "#355464";
    ctx.fill();
    ctx.strokeStyle = nearby ? "rgba(122, 231, 255, 0.95)" : "rgba(255, 255, 255, 0.18)";
    ctx.lineWidth = nearby ? 3 : 2;
    ctx.stroke();

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 26px Trebuchet MS";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("?", centerX, centerY + 1);

    if (nearby) {
        ctx.beginPath();
        ctx.arc(centerX, centerY, fishEntry.radius + 10 + pulse * 6, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(122, 231, 255, 0.45)";
        ctx.lineWidth = 2;
        ctx.stroke();
    }
}

function handleCanvasClick(event) {
    if (!gameState.started || gameState.gameOver || isGuessModalOpen()) {
        return;
    }

    const rect = canvas.getBoundingClientRect();
    const clickX = (event.clientX - rect.left) * (canvas.width / rect.width) + gameState.camera.x;
    const clickY = (event.clientY - rect.top) * (canvas.height / rect.height) + gameState.camera.y;

    for (const fishEntry of fish) {
        if (fishEntry.discovered) {
            continue;
        }

        const distanceToClick = Math.hypot(clickX - fishEntry.x, clickY - fishEntry.y);
        if (distanceToClick < fishEntry.radius) {
            if (getDistanceToSubmarine(fishEntry) < GAME_CONFIG.interactionDistance) {
                showEncounterModal(fishEntry);
            } else {
                showNotification("Move the submarine closer before scanning that signal.");
            }
            return;
        }
    }
}

function inspectNearestFish() {
    if (!gameState.started || gameState.gameOver || isGuessModalOpen()) {
        return;
    }

    const nearbyFish = fish
        .filter((fishEntry) => !fishEntry.discovered)
        .map((fishEntry) => ({ fishEntry, distance: getDistanceToSubmarine(fishEntry) }))
        .filter((entry) => entry.distance <= GAME_CONFIG.interactionDistance)
        .sort((left, right) => left.distance - right.distance);

    if (!nearbyFish.length) {
        showNotification("No signal in range. Swim closer, then press E or F.");
        return;
    }

    showEncounterModal(nearbyFish[0].fishEntry);
}

function showEncounterModal(fishEntry) {
    gameState.activeFishId = fishEntry.id;
    resetEncounterPanels();

    const modal = document.getElementById("guessModal");
    const modalContent = modal.querySelector(".modal-content");
    const fishImage = document.getElementById("fishImage");
    setImageWithFallback(fishImage, fishEntry.data.fallbackImage, fishEntry.id);
    fishImage.alt = `${fishEntry.data.name} photo`;
    document.getElementById("sourceLink").href = fishEntry.data.sourceUrl;
    document.getElementById("modalKicker").textContent = getPhaseKicker(fishEntry.phase);
    document.getElementById("modalTitle").textContent = getModalTitle();
    document.getElementById("dangerBadge").className = `danger-badge ${CONSERVATION_STATUSES[fishEntry.data.dangerLevel].className}`;
    document.getElementById("dangerBadge").textContent = `Conservation: ${CONSERVATION_STATUSES[fishEntry.data.dangerLevel].label}`;
    modalContent.classList.toggle("modal-content-learning", fishEntry.phase === "learning");
    if (fishEntry.phase === "free") {
        document.getElementById("freeResponseForm").classList.remove("hidden");
        document.getElementById("guessInput").value = "";
        document.getElementById("guessInput").focus();
    } else if (fishEntry.phase === "multiple") {
        document.getElementById("choiceForm").classList.remove("hidden");
        renderChoiceButtons(fishEntry);
    } else {
        showLearningPanel(fishEntry);
    }

    document.body.classList.add("modal-open");
    modalContent.scrollTop = 0;
    modal.classList.remove("hidden");
    loadFishImage(fishEntry);
}

function getModalTitle() {
    const activeFish = getActiveFish();
    if (!activeFish) return "Inspect this fish";
    if (activeFish.phase === "free") return "Type the fish name";
    if (activeFish.phase === "multiple") return "Choose the correct fish";
    return "Study this fish";
}

function getPhaseKicker(phase) {
    if (phase === "free") return "Free Response";
    if (phase === "multiple") return "Multiple Choice";
    return "Learning Card";
}

function resetEncounterPanels() {
    document.getElementById("freeResponseForm").classList.add("hidden");
    document.getElementById("choiceForm").classList.add("hidden");
    document.getElementById("learningPanel").classList.add("hidden");
    document.getElementById("result").classList.add("hidden");
    document.getElementById("result").classList.remove("correct", "wrong");
    document.getElementById("fishMeta").classList.add("hidden");
    document.getElementById("choiceButtons").innerHTML = "";
    document.getElementById("rescueOverlay").classList.add("hidden");
    document.getElementById("rescueOverlay").classList.remove("sliced");
    document.getElementById("rescueSlash").classList.add("hidden");
    document.getElementById("rescueSlash").removeAttribute("style");
    document.getElementById("pollutionInfoOverlay").classList.add("hidden");
    document.getElementById("studyPanel").classList.add("study-panel-locked");
    document.querySelector("#guessModal .modal-content").classList.remove("modal-content-learning");
    gameState.rescueDragStart = null;

    if (gameState.rescueSliceTimeout) {
        clearTimeout(gameState.rescueSliceTimeout);
        gameState.rescueSliceTimeout = null;
    }
}

function closeGuessModal() {
    document.getElementById("guessModal").classList.add("hidden");
    document.body.classList.remove("modal-open");
    const queuedNotification = gameState.postModalNotification;
    gameState.postModalNotification = null;
    gameState.activeFishId = null;

    if (queuedNotification) {
        showNotification(queuedNotification);
    }
}

function submitGuess() {
    const activeFish = getActiveFish();
    if (!activeFish || activeFish.phase !== "free") {
        return;
    }

    const userGuess = document.getElementById("guessInput").value.toLowerCase().trim();

    if (!userGuess) {
        showNotification("Type a fish name before submitting.");
        return;
    }

    const isCorrect = activeFish.data.aliases.some(
        (alias) => userGuess === alias || isFuzzyMatch(userGuess, alias)
    );

    handleQuizOutcome(isCorrect, activeFish);
}

function renderChoiceButtons(activeFish) {
    const choiceButtons = document.getElementById("choiceButtons");
    const options = getMultipleChoiceOptions(activeFish);

    options.forEach((option) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "choice-button";
        button.textContent = option;
        button.addEventListener("click", () => {
            handleQuizOutcome(option === activeFish.data.name, activeFish);
        });
        choiceButtons.appendChild(button);
    });
}

function getMultipleChoiceOptions(activeFish) {
    const distractors = gameState.currentSpecies
        .filter((species) => species.id !== activeFish.id)
        .map((species) => species.name);

    shuffleArray(distractors);
    const options = [activeFish.data.name, ...distractors.slice(0, 3)];
    shuffleArray(options);
    return options;
}

function handleQuizOutcome(isCorrect, activeFish) {
    showQuizResult(isCorrect, activeFish);

    if (isCorrect) {
        advanceStation(activeFish);
        updateStats();
        renderSpeciesList();
        const advanceMessage = getAdvanceMessage(activeFish);
        if (advanceMessage.includes("moved to a new location")) {
            gameState.postModalNotification = advanceMessage;
        } else {
            showNotification(advanceMessage);
        }
        checkForCompletion();
    } else {
        showNotification("Not quite. Read the fish card and keep exploring.");
    }
}

function showLearningPanel(activeFish) {
    document.getElementById("fishMeta").classList.remove("hidden");
    document.getElementById("learningPanel").classList.remove("hidden");
    document.getElementById("learningName").textContent = activeFish.data.name;
    document.getElementById("learningFact").textContent = activeFish.data.shortFact;
    document.getElementById("learningDescription").textContent = activeFish.data.description;
    renderRescueChallenge(activeFish);
    document.getElementById("learningDangerText").textContent = activeFish.data.dangerText;
    if (activeFish.needsRescue && !activeFish.rescueComplete) {
        showNotification(
            `Click, hold, and drag across the net to free ${activeFish.data.name}.`,
            "side"
        );
    } else {
        showNotification(
            `Study ${activeFish.data.name}, then continue to move it into multiple-choice mode.`,
            "side"
        );
    }
}

function renderRescueChallenge(activeFish) {
    const rescueOverlay = document.getElementById("rescueOverlay");
    const rescueOverlayPrompt = document.getElementById("rescueOverlayPrompt");
    const continueButton = document.getElementById("learningNextBtn");
    const studyPanel = document.getElementById("studyPanel");

    if (!activeFish.needsRescue) {
        continueButton.disabled = false;
        studyPanel.classList.remove("study-panel-locked");
        rescueOverlay.classList.add("hidden");
        return;
    }

    if (activeFish.rescueComplete) {
        continueButton.disabled = !activeFish.pollutionInfoSeen;
        studyPanel.classList.toggle("study-panel-locked", !activeFish.pollutionInfoSeen);
        rescueOverlay.classList.add("hidden");
        return;
    }

    rescueOverlay.classList.remove("hidden");
    rescueOverlay.classList.remove("sliced");
    rescueOverlayPrompt.textContent = `Click, hold, and drag across the net to cut ${activeFish.data.name} free.`;
    continueButton.disabled = true;
    studyPanel.classList.add("study-panel-locked");
}

function beginRescueSlice(event) {
    const activeFish = getActiveFish();
    if (!activeFish || activeFish.phase !== "learning" || activeFish.rescueComplete) {
        return;
    }

    const rescueOverlay = document.getElementById("rescueOverlay");
    const rescueSlash = document.getElementById("rescueSlash");
    const rect = rescueOverlay.getBoundingClientRect();

    gameState.rescueDragStart = {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top
    };
    rescueOverlay.setPointerCapture(event.pointerId);

    rescueSlash.classList.remove("hidden");
    rescueSlash.style.left = `${gameState.rescueDragStart.x}px`;
    rescueSlash.style.top = `${gameState.rescueDragStart.y}px`;
    rescueSlash.style.width = "0px";
    rescueSlash.style.transform = "rotate(0deg)";
}

function trackRescueSlice(event) {
    if (!gameState.rescueDragStart) {
        return;
    }

    const rescueOverlay = document.getElementById("rescueOverlay");
    const rescueSlash = document.getElementById("rescueSlash");
    const rect = rescueOverlay.getBoundingClientRect();
    const currentPoint = {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top
    };
    const deltaX = currentPoint.x - gameState.rescueDragStart.x;
    const deltaY = currentPoint.y - gameState.rescueDragStart.y;
    const distance = Math.hypot(deltaX, deltaY);
    const angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI);

    rescueSlash.style.left = `${gameState.rescueDragStart.x}px`;
    rescueSlash.style.top = `${gameState.rescueDragStart.y}px`;
    rescueSlash.style.width = `${distance}px`;
    rescueSlash.style.transform = `rotate(${angle}deg)`;
}

function endRescueSlice(event) {
    if (!gameState.rescueDragStart) {
        return;
    }

    const activeFish = getActiveFish();
    const rescueOverlay = document.getElementById("rescueOverlay");
    const rescueSlash = document.getElementById("rescueSlash");
    const rect = rescueOverlay.getBoundingClientRect();
    const endPoint = {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top
    };
    const distance = Math.hypot(endPoint.x - gameState.rescueDragStart.x, endPoint.y - gameState.rescueDragStart.y);

    if (activeFish && activeFish.phase === "learning" && !activeFish.rescueComplete && distance > rect.width * 0.35) {
        activeFish.rescueComplete = true;
        rescueOverlay.classList.add("sliced");
        document.getElementById("studyPanel").classList.add("study-panel-locked");
        document.getElementById("learningNextBtn").disabled = true;
        showNotification(`${activeFish.data.name} is free. Read the pollution briefing to continue.`, "side");

        gameState.rescueSliceTimeout = setTimeout(() => {
            rescueOverlay.classList.add("hidden");
            rescueOverlay.classList.remove("sliced");
            showPollutionInfoOverlay(activeFish);
            gameState.rescueSliceTimeout = null;
        }, 450);
    }

    if (rescueOverlay.hasPointerCapture(event.pointerId)) {
        rescueOverlay.releasePointerCapture(event.pointerId);
    }

    gameState.rescueDragStart = null;
    rescueSlash.classList.add("hidden");
    rescueSlash.removeAttribute("style");
}

function showPollutionInfoOverlay(activeFish) {
    document.getElementById("pollutionInfoTitle").textContent = "Pollution";
    document.getElementById("pollutionInfoLead").textContent = `${activeFish.data.name} can be harmed by discarded nets and other plastic waste in the ocean.`;
    document.getElementById("pollutionImpactText").textContent = "Discarded nets and plastic can trap fish, cut into skin and fins, block feeding, and make it harder to swim or escape predators. That harm also spreads outward by weakening reef food webs and damaging habitats other marine life depends on.";
    document.getElementById("pollutionActionText").textContent = "Use less single-use plastic, recycle correctly, join shoreline cleanups, and always dispose of fishing gear safely so nets and lines do not return to the water.";
    document.getElementById("pollutionInfoOverlay").classList.remove("hidden");
}

function closePollutionInfoOverlay() {
    const activeFish = getActiveFish();
    document.getElementById("pollutionInfoOverlay").classList.add("hidden");

    if (!activeFish || activeFish.phase !== "learning") {
        return;
    }

    activeFish.pollutionInfoSeen = true;
    document.getElementById("studyPanel").classList.remove("study-panel-locked");
    document.getElementById("learningNextBtn").disabled = false;
    showNotification(`You can keep studying ${activeFish.data.name} now.`, "side");
}

function showQuizResult(isCorrect, activeFish) {
    const resultDiv = document.getElementById("result");
    const resultMessage = document.getElementById("resultMessage");
    const correctAnswer = document.getElementById("correctAnswer");
    const description = document.getElementById("description");
    const resultDanger = document.getElementById("resultDanger");

    document.getElementById("freeResponseForm").classList.add("hidden");
    document.getElementById("choiceForm").classList.add("hidden");
    document.getElementById("fishMeta").classList.remove("hidden");
    resultDiv.classList.remove("hidden", "wrong", "correct");
    resultDiv.classList.add(isCorrect ? "correct" : "wrong");

    resultMessage.textContent = isCorrect ? "Correct identification" : "Incorrect identification";
    correctAnswer.textContent = `Species: ${activeFish.data.name}`;
    description.textContent = activeFish.data.description;
    resultDanger.textContent = activeFish.data.dangerText;
}

function handleLearningContinue() {
    const activeFish = getActiveFish();
    if (!activeFish || activeFish.phase !== "learning") {
        closeGuessModal();
        return;
    }

    if (activeFish.needsRescue && !activeFish.rescueComplete) {
        showNotification("Clear the debris first so the fish can swim away safely.", "side");
        return;
    }

    advanceStation(activeFish);
    updateStats();
    renderSpeciesList();
    gameState.postModalNotification = `${activeFish.data.name} moved to a new location in multiple-choice mode.`;
    closeGuessModal();
}

function handleResultContinue() {
    closeGuessModal();
}

function advanceStation(activeFish) {
    if (activeFish.phase === "learning") {
        activeFish.phase = "multiple";
        relocateFish(activeFish);
        gameState.score += 2;
        return;
    }

    if (activeFish.phase === "multiple") {
        activeFish.phase = "free";
        relocateFish(activeFish);
        gameState.score += 5;
        return;
    }

    gameState.discoveredFish.add(activeFish.id);
    activeFish.discovered = true;
    gameState.score += 10;
}

function getAdvanceMessage(activeFish) {
    if (activeFish.phase === "free") {
        return `${activeFish.data.name} moved to a new location in free-response mode.`;
    }

    return `${activeFish.data.name} fully mastered.`;
}

function relocateFish(activeFish) {
    const position = generateRelocationPosition(activeFish);
    activeFish.x = position.x;
    activeFish.y = position.y;
}

function generateRelocationPosition(activeFish) {
    let attempts = 0;

    while (attempts < 400) {
        const candidate = {
            x: 120 + Math.random() * (GAME_CONFIG.mapWidth - 240),
            y: 120 + Math.random() * (GAME_CONFIG.mapHeight - 240)
        };

        const farEnoughFromOldSpot = Math.hypot(candidate.x - activeFish.x, candidate.y - activeFish.y) > 650;
        const farEnoughFromSubmarine = Math.hypot(candidate.x - submarine.x, candidate.y - submarine.y) > 420;
        const farEnoughFromOthers = fish
            .filter((fishEntry) => fishEntry !== activeFish && !fishEntry.discovered)
            .every((fishEntry) => Math.hypot(candidate.x - fishEntry.x, candidate.y - fishEntry.y) > 120);

        if (farEnoughFromOldSpot && farEnoughFromSubmarine && farEnoughFromOthers) {
            return candidate;
        }

        attempts += 1;
    }

    return {
        x: Math.max(120, Math.min(activeFish.x + 700, GAME_CONFIG.mapWidth - 120)),
        y: Math.max(120, Math.min(activeFish.y + 420, GAME_CONFIG.mapHeight - 120))
    };
}

function checkForCompletion() {
    if (gameState.discoveredFish.size === gameState.currentSpecies.length && gameState.currentSpecies.length) {
        setTimeout(showGameOverModal, 700);
    }
}

function updateStats() {
    const totalSpecies = gameState.currentSpecies.length || TOTAL_SPECIES_PER_GAME;
    const completedCount = gameState.discoveredFish.size;
    const progress = Math.round((completedCount / totalSpecies) * 100);

    document.getElementById("score").textContent = gameState.score;
    document.getElementById("caught").textContent = completedCount;
    document.getElementById("totalFish").textContent = totalSpecies;
    document.getElementById("progressPercent").textContent = `${progress}%`;
    document.getElementById("progressText").textContent = `${completedCount} of ${totalSpecies} species mastered`;
    document.getElementById("progressFill").style.width = `${progress}%`;
    document.getElementById("statScoreLabel").textContent = "Score";
}

function renderSpeciesList() {
    const speciesList = document.getElementById("speciesList");
    const displayedSpecies = gameState.currentSpecies.length ? gameState.currentSpecies : [];
    speciesList.innerHTML = "";

    displayedSpecies.forEach((species) => {
        const item = document.createElement("li");
        const station = fish.find((fishEntry) => fishEntry.id === species.id);
        const discovered = gameState.discoveredFish.has(species.id);
        const conservationStatus = CONSERVATION_STATUSES[species.dangerLevel];

        if (discovered) {
            item.classList.add("caught");
        }

        item.innerHTML = `
            <div class="species-copy">
                <span>${discovered ? species.name : "Unknown Signal"}</span>
                <small>${discovered ? species.shortFact : getSpeciesHint(station)}</small>
            </div>
            <div class="species-side">
                <span class="species-status">${getSpeciesStatus(station, discovered)}</span>
                ${discovered ? `<span class="mini-danger ${conservationStatus.className}">${conservationStatus.label}</span>` : ""}
            </div>
        `;

        speciesList.appendChild(item);
    });

    if (!displayedSpecies.length) {
        const emptyState = document.createElement("li");
        emptyState.innerHTML = `
            <div class="species-copy">
                <span>No active expedition</span>
                <small>Choose a mode to load 15 random fish from the 100-species pool.</small>
            </div>
        `;
        speciesList.appendChild(emptyState);
    }

    document.getElementById("speciesTitle").textContent = "Species Log";
}

function syncModeUi() {
    document.getElementById("modeBadge").innerHTML = '<span class="badge-dot"></span>Progressive Expedition';
    document.getElementById("heroText").textContent = "Each station begins as a learning card, then respawns as multiple choice, then respawns again as free response.";
    document.getElementById("missionText").textContent = "Inspect nearby stations with E, F, or a click. Learn the fish first, then find it again for multiple choice, then again for free response.";
}

function updateHud() {
    const statusEl = document.getElementById("hudStatus");
    const targetEl = document.getElementById("hudTarget");

    if (!gameState.started) {
        statusEl.textContent = "Exploring";
        targetEl.textContent = "Find a nearby signal";
        return;
    }

    const nearest = getNearestUndiscoveredFish();

    if (!nearest) {
        statusEl.textContent = "All signals resolved";
        targetEl.textContent = "Mission complete";
        return;
    }

    if (nearest.distance < GAME_CONFIG.interactionDistance) {
        statusEl.textContent = getPhasePrompt(nearest.fishEntry.phase);
        targetEl.textContent = "Press E or F near the signal";
    } else {
        statusEl.textContent = "Exploring";
        targetEl.textContent = `${Math.round(nearest.distance)} px away`;
    }
}

function getNearestUndiscoveredFish() {
    const undiscoveredFish = fish.filter((fishEntry) => !fishEntry.discovered);

    if (!undiscoveredFish.length) {
        return null;
    }

    return undiscoveredFish.reduce((closest, fishEntry) => {
        const distance = getDistanceToSubmarine(fishEntry);
        if (!closest || distance < closest.distance) {
            return { fishEntry, distance };
        }
        return closest;
    }, null);
}

function showGameOverModal() {
    if (gameState.gameOver) {
        return;
    }

    gameState.gameOver = true;
    const modeConfig = GAME_MODES[gameState.mode];
    document.getElementById("gameOverTitle").textContent = modeConfig.completeTitle;
    document.getElementById("gameOverText").textContent = modeConfig.completeText;
    document.getElementById("finalScore").textContent = `${modeConfig.scoreLabel}: ${gameState.score}`;
    document.getElementById("gameOverModal").classList.remove("hidden");
}

function showNotification(message, placement = "side") {
    const toast = document.getElementById("toast");
    toast.textContent = message;
    toast.classList.remove("toast-side");

    if (placement === "side") {
        toast.classList.add("toast-side");
    }

    toast.classList.remove("hidden");

    if (gameState.notificationTimeout) {
        clearTimeout(gameState.notificationTimeout);
    }

    gameState.notificationTimeout = setTimeout(() => {
        toast.classList.add("hidden");
    }, 2400);
}

function prefetchSpeciesImages() {
    gameState.currentSpecies.forEach((species) => {
        fetchFishMedia(species).catch(() => null);
    });
}

async function loadFishImage(fishEntry) {
    const imageElement = document.getElementById("fishImage");
    const sourceLink = document.getElementById("sourceLink");
    const requestToken = ++gameState.imageRequestToken;

    setImageWithFallback(imageElement, fishEntry.data.fallbackImage, fishEntry.id);

    try {
        const media = await fetchFishMedia(fishEntry.data);

        if (requestToken !== gameState.imageRequestToken || gameState.activeFishId !== fishEntry.id) {
            return;
        }

        const resolvedImage = media.imageUrl || fishEntry.data.fallbackImage;
        setImageWithFallback(imageElement, resolvedImage, fishEntry.id);
        sourceLink.href = media.pageUrl || fishEntry.data.sourceUrl;
    } catch (_error) {
        if (requestToken !== gameState.imageRequestToken || gameState.activeFishId !== fishEntry.id) {
            return;
        }

        setImageWithFallback(imageElement, fishEntry.data.fallbackImage, fishEntry.id);
        sourceLink.href = fishEntry.data.sourceUrl;
    }
}

async function fetchFishMedia(species) {
    if (gameState.imageCache[species.id]) {
        return gameState.imageCache[species.id];
    }

    const exactMedia = await fetchWikipediaMediaByTitle(species.wikiQuery);
    if (exactMedia && exactMedia.imageUrl) {
        gameState.imageCache[species.id] = exactMedia;
        return exactMedia;
    }

    const searchMedia = await fetchWikipediaMediaBySearch(species.wikiQuery);
    const resolvedMedia = searchMedia || exactMedia || {
        imageUrl: species.fallbackImage,
        pageUrl: species.sourceUrl
    };

    gameState.imageCache[species.id] = resolvedMedia;
    return resolvedMedia;
}

async function fetchWikipediaMediaByTitle(title) {
    const url = `https://en.wikipedia.org/w/api.php?action=query&prop=pageimages|info&inprop=url&piprop=thumbnail&pithumbsize=640&titles=${encodeURIComponent(title)}&format=json&origin=*`;
    const response = await fetch(url, { headers: { "Accept": "application/json" } });

    if (!response.ok) {
        throw new Error(`Wikipedia title lookup failed with status ${response.status}`);
    }

    const data = await response.json();
    const pages = data && data.query && data.query.pages ? Object.values(data.query.pages) : [];
    const page = pages.find((entry) => !entry.missing) || null;

    if (!page) {
        return null;
    }

    return {
        imageUrl: page.thumbnail ? page.thumbnail.source : null,
        pageUrl: page.fullurl || `https://en.wikipedia.org/wiki/${encodeURIComponent(title.replace(/ /g, "_"))}`
    };
}

async function fetchWikipediaMediaBySearch(query) {
    const url = `https://en.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(query)}&gsrlimit=1&prop=pageimages|info&inprop=url&piprop=thumbnail&pithumbsize=640&format=json&origin=*`;
    const response = await fetch(url, { headers: { "Accept": "application/json" } });

    if (!response.ok) {
        throw new Error(`Wikipedia search lookup failed with status ${response.status}`);
    }

    const data = await response.json();
    const pages = data && data.query && data.query.pages ? Object.values(data.query.pages) : [];
    const page = pages[0];

    if (!page) {
        return null;
    }

    return {
        imageUrl: page.thumbnail ? page.thumbnail.source : null,
        pageUrl: page.fullurl || null
    };
}

function setImageWithFallback(imageElement, imageUrl, fishId) {
    imageElement.dataset.fishId = String(fishId);
    imageElement.dataset.fallbackIndex = "0";

    imageElement.onerror = () => {
        if (imageElement.dataset.fishId !== String(fishId)) {
            return;
        }

        const currentIndex = Number(imageElement.dataset.fallbackIndex || "0");
        const nextIndex = currentIndex + 1;
        const backupImage = FALLBACK_FISH_PHOTOS[nextIndex];

        if (backupImage) {
            imageElement.dataset.fallbackIndex = String(nextIndex);
            imageElement.src = backupImage;
            return;
        }

        imageElement.onerror = null;
        imageElement.src = FALLBACK_FISH_PHOTOS[0];
    };

    imageElement.src = imageUrl || FALLBACK_FISH_PHOTOS[0];
}

function getActiveFish() {
    return fish.find((fishEntry) => fishEntry.id === gameState.activeFishId);
}

function getDistanceToSubmarine(fishEntry) {
    return Math.hypot(
        fishEntry.x - (submarine.x + submarine.width / 2),
        fishEntry.y - (submarine.y + submarine.height / 2)
    );
}

function updateCamera() {
    const desiredX = submarine.x + submarine.width / 2 - canvas.width / 2;
    const desiredY = submarine.y + submarine.height / 2 - canvas.height / 2;

    gameState.camera.x = Math.max(0, Math.min(desiredX, GAME_CONFIG.mapWidth - canvas.width));
    gameState.camera.y = Math.max(0, Math.min(desiredY, GAME_CONFIG.mapHeight - canvas.height));
}

function getSeabedY(worldX) {
    return GAME_CONFIG.mapHeight - 85 - Math.sin(worldX / 95) * 28 - Math.cos(worldX / 220) * 20;
}

function getPhasePrompt(phase) {
    if (phase === "free") return "Free response ready";
    if (phase === "multiple") return "Multiple choice ready";
    return "Learning card ready";
}

function getSpeciesStatus(station, discovered) {
    if (discovered) return "Mastered";
    if (!station) return "Pending";
    if (station.phase === "free") return "Free Response";
    if (station.phase === "multiple") return "Multiple Choice";
    return "Learning";
}

function getSpeciesHint(station) {
    if (!station) return "Track this signal in the reef.";
    if (station.phase === "free") return "Find it again and type the fish name.";
    if (station.phase === "multiple") return "Find it again for the multiple-choice round.";
    return "Visit this station to learn the fish first.";
}

function isGuessModalOpen() {
    return !document.getElementById("guessModal").classList.contains("hidden");
}

function isFuzzyMatch(input, target) {
    if (input === target) return true;
    if (input.length < 3 || target.length < 3) return false;

    const inputWords = input.split(" ");
    const targetWords = target.split(" ");

    return inputWords.some((word) =>
        targetWords.some((targetWord) => {
            const matches = [...word].filter((char, index) => char === targetWord[index]).length;
            return matches >= Math.max(word.length - 1, targetWord.length - 1);
        })
    );
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}
