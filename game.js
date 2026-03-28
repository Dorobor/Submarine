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
    notificationTimeout: null
};

let canvas;
let ctx;

const submarine = {
    x: 100,
    y: 100,
    width: 54,
    height: 28,
    vx: 0,
    vy: 0
};

const fish = [];

document.addEventListener("DOMContentLoaded", () => {
    initializeGame();
    setupEventListeners();
    renderSpeciesList();
    updateStats();
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
    for (let i = 0; i < 26; i += 1) {
        gameState.bubbles.push({
            x: Math.random() * GAME_CONFIG.canvasWidth,
            y: Math.random() * GAME_CONFIG.canvasHeight,
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

    document.getElementById("learningNextBtn").addEventListener("click", closeGuessModal);
    document.getElementById("nextBtn").addEventListener("click", closeGuessModal);
    document.getElementById("restartBtn").addEventListener("click", showStartScreen);

    document.getElementById("guessModal").addEventListener("click", (event) => {
        if (event.target.id === "guessModal") {
            closeGuessModal();
        }
    });

    document.querySelectorAll(".mode-card").forEach((button) => {
        button.addEventListener("click", () => startGame(button.dataset.mode));
    });
}

function startGame(mode) {
    gameState.mode = mode;
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
    document.getElementById("startModal").classList.add("hidden");
    document.getElementById("gameOverModal").classList.add("hidden");
    showNotification(`${GAME_MODES[mode].intro} Use E, F, or click to inspect.`);
}

function showStartScreen() {
    gameState.started = false;
    gameState.gameOver = false;
    gameState.mode = null;
    gameState.score = 0;
    gameState.activeFishId = null;
    gameState.currentSpecies = [];
    gameState.discoveredFish.clear();
    fish.length = 0;
    resetSubmarine();
    closeGuessModal();
    document.getElementById("gameOverModal").classList.add("hidden");
    document.getElementById("startModal").classList.remove("hidden");
    syncModeUi();
    updateStats();
    renderSpeciesList();
    showNotification("Choose a mode to launch a new expedition.");
}

function resetSubmarine() {
    submarine.x = 100;
    submarine.y = 100;
    submarine.vx = 0;
    submarine.vy = 0;
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
            x: 70 + Math.random() * (GAME_CONFIG.canvasWidth - 140),
            y: 90 + Math.random() * (GAME_CONFIG.canvasHeight - 170)
        };

        const farEnoughFromOthers = positions.every(
            (position) => Math.hypot(position.x - candidate.x, position.y - candidate.y) > 105
        );
        const farEnoughFromSpawn = Math.hypot(candidate.x - 120, candidate.y - 110) > 110;

        if (farEnoughFromOthers && farEnoughFromSpawn) {
            positions.push(candidate);
        }

        attempts += 1;
    }

    while (positions.length < count) {
        positions.push({
            x: 90 + (positions.length % 5) * 140,
            y: 120 + Math.floor(positions.length / 5) * 120
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

    submarine.x = Math.max(22, Math.min(submarine.x, GAME_CONFIG.canvasWidth - submarine.width - 20));
    submarine.y = Math.max(36, Math.min(submarine.y, GAME_CONFIG.canvasHeight - submarine.height - 28));

    updateBubbles();
    updateHud();
}

function updateBubbles() {
    gameState.bubbles.forEach((bubble) => {
        bubble.y -= bubble.speed;
        bubble.x += bubble.drift;

        if (bubble.y + bubble.radius < 0) {
            bubble.y = GAME_CONFIG.canvasHeight + bubble.radius;
            bubble.x = Math.random() * GAME_CONFIG.canvasWidth;
        }

        if (bubble.x < -10) bubble.x = GAME_CONFIG.canvasWidth + 10;
        if (bubble.x > GAME_CONFIG.canvasWidth + 10) bubble.x = -10;
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
}

function drawBubbles() {
    gameState.bubbles.forEach((bubble) => {
        ctx.beginPath();
        ctx.arc(bubble.x, bubble.y, bubble.radius, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(210, 245, 255, 0.18)";
        ctx.fill();
        ctx.strokeStyle = "rgba(210, 245, 255, 0.26)";
        ctx.stroke();
    });
}

function drawDepthLines() {
    ctx.strokeStyle = "rgba(120, 236, 255, 0.08)";
    ctx.lineWidth = 1;

    for (let y = 50; y < canvas.height; y += 70) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
    }

    for (let x = 60; x < canvas.width; x += 80) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
    }
}

function drawSeabed() {
    ctx.fillStyle = "#0a2230";
    ctx.beginPath();
    ctx.moveTo(0, canvas.height - 42);
    for (let x = 0; x <= canvas.width; x += 40) {
        const y = canvas.height - 32 - Math.sin(x / 45) * 10;
        ctx.lineTo(x, y);
    }
    ctx.lineTo(canvas.width, canvas.height);
    ctx.lineTo(0, canvas.height);
    ctx.closePath();
    ctx.fill();
}

function drawSubmarine() {
    const x = submarine.x;
    const y = submarine.y;

    ctx.save();
    ctx.shadowColor = "rgba(255, 209, 102, 0.45)";
    ctx.shadowBlur = 18;

    ctx.fillStyle = "#ffd166";
    ctx.beginPath();
    ctx.ellipse(x + submarine.width / 2, y + submarine.height / 2, submarine.width / 2, submarine.height / 2, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#f4b942";
    ctx.fillRect(x + 10, y + 4, 22, 8);

    ctx.fillStyle = "#7ae7ff";
    ctx.beginPath();
    ctx.arc(x + submarine.width / 2 + 8, y + submarine.height / 2, 7, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    ctx.strokeStyle = "#ffd166";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x + submarine.width / 2 - 2, y + 2);
    ctx.lineTo(x + submarine.width / 2 - 2, y - 12);
    ctx.lineTo(x + submarine.width / 2 + 8, y - 12);
    ctx.stroke();

    ctx.fillStyle = "#ff9f1c";
    ctx.beginPath();
    ctx.moveTo(x + submarine.width - 2, y + submarine.height / 2);
    ctx.lineTo(x + submarine.width - 12, y + 4);
    ctx.lineTo(x + submarine.width - 12, y + submarine.height - 4);
    ctx.closePath();
    ctx.fill();
}

function drawFish(fishEntry) {
    const centerX = fishEntry.x;
    const centerY = fishEntry.y;
    const pulse = (Math.sin(Date.now() / 280 + fishEntry.pulseOffset) + 1) / 2;
    const distance = getDistanceToSubmarine(fishEntry);
    const nearby = gameState.started && distance < GAME_CONFIG.interactionDistance;

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
    const clickX = (event.clientX - rect.left) * (canvas.width / rect.width);
    const clickY = (event.clientY - rect.top) * (canvas.height / rect.height);

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
    document.getElementById("fishImage").src = fishEntry.data.image;
    document.getElementById("sourceLink").href = fishEntry.data.sourceUrl;
    document.getElementById("modalKicker").textContent = gameState.mode === "learning" ? "Learning Card" : "Specimen Scan";
    document.getElementById("modalTitle").textContent = getModalTitle();
    document.getElementById("dangerBadge").className = `danger-badge ${DANGER_LEVELS[fishEntry.data.dangerLevel].className}`;
    document.getElementById("dangerBadge").textContent = `Danger: ${DANGER_LEVELS[fishEntry.data.dangerLevel].label}`;

    if (gameState.mode === "free") {
        document.getElementById("freeResponseForm").classList.remove("hidden");
        document.getElementById("guessInput").value = "";
        document.getElementById("guessInput").focus();
    } else if (gameState.mode === "multiple") {
        document.getElementById("choiceForm").classList.remove("hidden");
        renderChoiceButtons(fishEntry);
    } else {
        showLearningPanel(fishEntry);
    }

    modal.classList.remove("hidden");
}

function getModalTitle() {
    if (gameState.mode === "free") return "Type the fish name";
    if (gameState.mode === "multiple") return "Choose the correct fish";
    return "Study this fish";
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
    gameState.activeFishId = null;
}

function submitGuess() {
    if (gameState.mode !== "free") {
        return;
    }

    const activeFish = getActiveFish();
    if (!activeFish) {
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
        markFishDiscovered(activeFish);
        gameState.score += GAME_MODES[gameState.mode].scorePerCorrect;
        updateStats();
        renderSpeciesList();
        showNotification(`${activeFish.data.name} added to your species log.`);
        checkForCompletion();
    } else {
        showNotification("Not quite. Read the fish card and keep exploring.");
    }
}

function showLearningPanel(activeFish) {
    markFishDiscovered(activeFish);
    updateStats();
    renderSpeciesList();
    checkForCompletion();

    document.getElementById("fishMeta").classList.remove("hidden");
    document.getElementById("learningPanel").classList.remove("hidden");
    document.getElementById("learningName").textContent = activeFish.data.name;
    document.getElementById("learningFact").textContent = activeFish.data.shortFact;
    document.getElementById("learningDescription").textContent = activeFish.data.description;
    document.getElementById("learningDangerText").textContent = activeFish.data.dangerText;
    showNotification(`${activeFish.data.name} logged to your learning journal.`);
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

function markFishDiscovered(activeFish) {
    if (gameState.discoveredFish.has(activeFish.id)) {
        return;
    }

    gameState.discoveredFish.add(activeFish.id);
    activeFish.discovered = true;

    if (gameState.mode === "learning") {
        gameState.score = gameState.discoveredFish.size;
    }
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
    const modeConfig = gameState.mode ? GAME_MODES[gameState.mode] : null;

    document.getElementById("score").textContent = gameState.score;
    document.getElementById("caught").textContent = completedCount;
    document.getElementById("totalFish").textContent = totalSpecies;
    document.getElementById("progressPercent").textContent = `${progress}%`;
    document.getElementById("progressText").textContent = `${completedCount} of ${totalSpecies} ${
        modeConfig ? modeConfig.progressNoun : "species cataloged"
    }`;
    document.getElementById("progressFill").style.width = `${progress}%`;
    document.getElementById("statScoreLabel").textContent = modeConfig ? modeConfig.scoreLabel : "Score";
}

function renderSpeciesList() {
    const speciesList = document.getElementById("speciesList");
    const modeConfig = gameState.mode ? GAME_MODES[gameState.mode] : null;
    const displayedSpecies = gameState.currentSpecies.length ? gameState.currentSpecies : [];
    speciesList.innerHTML = "";

    displayedSpecies.forEach((species) => {
        const item = document.createElement("li");
        const discovered = gameState.discoveredFish.has(species.id);
        const danger = DANGER_LEVELS[species.dangerLevel];

        if (discovered) {
            item.classList.add("caught");
        }

        item.innerHTML = `
            <div class="species-copy">
                <span>${discovered ? species.name : "Unknown Signal"}</span>
                <small>${discovered ? species.shortFact : "Track this signal in the reef."}</small>
            </div>
            <div class="species-side">
                <span class="species-status">${discovered ? (gameState.mode === "learning" ? "Studied" : "Identified") : "Pending"}</span>
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

    document.getElementById("speciesTitle").textContent = modeConfig && gameState.mode === "learning" ? "Learning Log" : "Species Log";
}

function syncModeUi() {
    const modeConfig = gameState.mode ? GAME_MODES[gameState.mode] : null;

    document.getElementById("modeBadge").textContent = modeConfig ? modeConfig.title : "Choose a mode";
    document.getElementById("heroText").textContent = modeConfig
        ? `${modeConfig.intro} Each run samples 15 fish from a 100-species pool.`
        : "Pick a mode before launching your submarine. Each run samples 15 random fish from a 100-species pool.";
    document.getElementById("missionText").textContent = modeConfig
        ? modeConfig.mission
        : "Choose a game mode first. Each new game loads 15 random fish, and you inspect nearby signals with E, F, or a click.";
}

function updateHud() {
    const statusEl = document.getElementById("hudStatus");
    const targetEl = document.getElementById("hudTarget");

    if (!gameState.started) {
        statusEl.textContent = "Waiting to launch";
        targetEl.textContent = "Choose a mode to begin";
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
        statusEl.textContent = GAME_MODES[gameState.mode].statusPrompt;
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

function getActiveFish() {
    return fish.find((fishEntry) => fishEntry.id === gameState.activeFishId);
}

function getDistanceToSubmarine(fishEntry) {
    return Math.hypot(
        fishEntry.x - (submarine.x + submarine.width / 2),
        fishEntry.y - (submarine.y + submarine.height / 2)
    );
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
