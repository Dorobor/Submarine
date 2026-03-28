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
            drift: (Math.random() - 0.5) * 0.7
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
            pulseOffset: Math.random() * Math.PI * 2
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
        bubble.x += bubble.drift;

        if (bubble.y + bubble.radius < 0) {
            bubble.y = GAME_CONFIG.mapHeight + bubble.radius;
            bubble.x = Math.random() * GAME_CONFIG.mapWidth;
        }

        if (bubble.x < -10) bubble.x = GAME_CONFIG.mapWidth + 10;
        if (bubble.x > GAME_CONFIG.mapWidth + 10) bubble.x = -10;
    });
}

function draw() {
    drawOcean();
    drawBubbles();
    drawDepthLines();
    drawSeabed();

    fish.forEach((fishEntry) => {
        if (!fishEntry.discovered) {
            drawFish(fishEntry);
        }
    });

    if (gameState.started) {
        drawSubmarine();
    }
}

function drawOcean() {
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, "#1b657f");
    gradient.addColorStop(0.45, "#0e4056");
    gradient.addColorStop(1, "#05131f");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const lightGradient = ctx.createRadialGradient(canvas.width * 0.35, 60, 10, canvas.width * 0.35, 60, 260);
    lightGradient.addColorStop(0, "rgba(255,255,255,0.20)");
    lightGradient.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = lightGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const offsetX = -gameState.camera.x * 0.08;
    const offsetY = -gameState.camera.y * 0.05;

    ctx.strokeStyle = "rgba(255,255,255,0.05)";
    ctx.lineWidth = 2;
    for (let i = -1; i < 7; i += 1) {
        const waveY = 80 + i * 90 + (offsetY % 90);
        ctx.beginPath();
        for (let x = -40; x <= canvas.width + 40; x += 30) {
            const y = waveY + Math.sin((x + offsetX) / 70) * 8;
            if (x === -40) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        ctx.stroke();
    }
}

function drawBubbles() {
    gameState.bubbles.forEach((bubble) => {
        const screenX = bubble.x - gameState.camera.x;
        const screenY = bubble.y - gameState.camera.y;

        if (screenX < -20 || screenX > canvas.width + 20 || screenY < -20 || screenY > canvas.height + 20) {
            return;
        }

        ctx.beginPath();
        ctx.arc(screenX, screenY, bubble.radius, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(210, 245, 255, 0.18)";
        ctx.fill();
        ctx.strokeStyle = "rgba(210, 245, 255, 0.26)";
        ctx.stroke();
    });
}

function drawDepthLines() {
    ctx.strokeStyle = "rgba(120, 236, 255, 0.08)";
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

function drawSeabed() {
    ctx.fillStyle = "#0a2230";
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
}

function drawSubmarine() {
    const x = submarine.x - gameState.camera.x;
    const y = submarine.y - gameState.camera.y;
    const centerX = x + submarine.width / 2;
    const centerY = y + submarine.height / 2;

    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(submarine.angle);
    ctx.translate(-submarine.width / 2, -submarine.height / 2);
    ctx.shadowColor = "rgba(255, 209, 102, 0.45)";
    ctx.shadowBlur = 18;

    ctx.fillStyle = "#ffd166";
    ctx.beginPath();
    ctx.ellipse(submarine.width / 2, submarine.height / 2, submarine.width / 2, submarine.height / 2, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#f4b942";
    ctx.fillRect(10, 4, 22, 8);

    ctx.fillStyle = "#7ae7ff";
    ctx.beginPath();
    ctx.arc(submarine.width / 2 + 8, submarine.height / 2, 7, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "#ffd166";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(submarine.width / 2 - 2, 2);
    ctx.lineTo(submarine.width / 2 - 2, -12);
    ctx.lineTo(submarine.width / 2 + 8, -12);
    ctx.stroke();

    ctx.fillStyle = "#ff9f1c";
    ctx.beginPath();
    ctx.moveTo(submarine.width - 2, submarine.height / 2);
    ctx.lineTo(submarine.width - 12, 4);
    ctx.lineTo(submarine.width - 12, submarine.height - 4);
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
    const fishImage = document.getElementById("fishImage");
    setImageWithFallback(fishImage, fishEntry.data.fallbackImage, fishEntry.id);
    fishImage.alt = `${fishEntry.data.name} photo`;
    document.getElementById("sourceLink").href = fishEntry.data.sourceUrl;
    document.getElementById("modalKicker").textContent = getPhaseKicker(fishEntry.phase);
    document.getElementById("modalTitle").textContent = getModalTitle();
    document.getElementById("dangerBadge").className = `danger-badge ${DANGER_LEVELS[fishEntry.data.dangerLevel].className}`;
    document.getElementById("dangerBadge").textContent = `Danger: ${DANGER_LEVELS[fishEntry.data.dangerLevel].label}`;

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
}

function closeGuessModal() {
    document.getElementById("guessModal").classList.add("hidden");
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
    document.getElementById("learningDangerText").textContent = activeFish.data.dangerText;
    showNotification(`Study ${activeFish.data.name}, then continue to move it into multiple-choice mode.`);
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
        const danger = DANGER_LEVELS[species.dangerLevel];

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
                ${discovered ? `<span class="mini-danger ${danger.className}">${danger.label}</span>` : ""}
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
    document.getElementById("modeBadge").textContent = gameState.mode ? "Progressive Expedition" : "Choose a mode";
    document.getElementById("heroText").textContent = gameState.mode
        ? "Each station begins as a learning card, then respawns as multiple choice, then respawns again as free response."
        : "Pick a mode before launching your submarine. Each run samples 15 random fish from a 100-species pool.";
    document.getElementById("missionText").textContent = gameState.mode
        ? "Inspect nearby stations with E, F, or a click. Learn the fish first, then find it again for multiple choice, then again for free response."
        : "Choose a game mode first. Each new game loads 15 random fish, and you inspect nearby signals with E, F, or a click.";
}

function updateHud() {
    const statusEl = document.getElementById("hudStatus");
    const targetEl = document.getElementById("hudTarget");

    if (!gameState.started) {
        statusEl.textContent = "Exploring";
        targetEl.textContent = "Find a nearby signal";
        return;
    }

    const undiscoveredFish = fish.filter((fishEntry) => !fishEntry.discovered);

    if (!undiscoveredFish.length) {
        statusEl.textContent = "All signals resolved";
        targetEl.textContent = "Mission complete";
        return;
    }

    const nearest = undiscoveredFish.reduce((closest, fishEntry) => {
        const distance = getDistanceToSubmarine(fishEntry);
        if (!closest || distance < closest.distance) {
            return { fishEntry, distance };
        }
        return closest;
    }, null);

    if (!nearest) {
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

function showNotification(message) {
    const toast = document.getElementById("toast");
    toast.textContent = message;
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

        setImageWithFallback(imageElement, media.imageUrl || fishEntry.data.fallbackImage, fishEntry.id);
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
