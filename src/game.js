import { fishData } from "./data/fishData.js";
import { Player } from "./player.js";

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const promptEl = document.getElementById("interactionPrompt");
const modalEl = document.getElementById("quizModal");
const closeModalButton = document.getElementById("closeModal");
const keepExploringButton = document.getElementById("nextPrompt");
const fishImage = document.getElementById("fishImage");
const fishLocation = document.getElementById("fishLocation");
const feedbackMessage = document.getElementById("feedbackMessage");
const answerButtons = document.getElementById("answerButtons");
const learnMoreLink = document.getElementById("learnMoreLink");

const world = { width: canvas.width, height: canvas.height };
const player = new Player(120, 120);
const keys = new Set();
const spawnSlots = [
  { x: 220, y: 370 },
  { x: 690, y: 290 },
  { x: 810, y: 420 },
  { x: 520, y: 180 },
  { x: 350, y: 255 },
  { x: 120, y: 210 },
];
const fishPlacements = assignFishSpawns(fishData, spawnSlots);

let lastFrameTime = performance.now();
let activeFish = null;
let answeredFishIds = new Set();
let interactionLocked = false;

function shuffleArray(items) {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }
  return copy;
}

function assignFishSpawns(fishEntries, slots) {
  const shuffledSlots = shuffleArray(slots);
  return fishEntries.map((fish, index) => ({
    ...fish,
    worldX: shuffledSlots[index % shuffledSlots.length].x,
    worldY: shuffledSlots[index % shuffledSlots.length].y,
  }));
}

function registerInput() {
  window.addEventListener("keydown", (event) => {
    const key = event.key.toLowerCase();

    if (["arrowup", "arrowdown", "arrowleft", "arrowright", " ", "f"].includes(key)) {
      event.preventDefault();
    }

    keys.add(key);

    if (key === "f" && activeFish && !interactionLocked) {
      openQuiz(activeFish);
    }
  });

  window.addEventListener("keyup", (event) => {
    keys.delete(event.key.toLowerCase());
  });
}

function drawBackground() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, "#79d8e4");
  gradient.addColorStop(0.46, "#2587a1");
  gradient.addColorStop(1, "#073e57");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  drawSunbeams();
  drawSand();
  drawKelpBeds();
  drawBubbles();
}

function drawSunbeams() {
  ctx.save();
  ctx.globalAlpha = 0.16;
  for (let i = 0; i < 6; i += 1) {
    const x = 60 + i * 150;
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + 80, 0);
    ctx.lineTo(x - 10, canvas.height);
    ctx.lineTo(x - 70, canvas.height);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

function drawSand() {
  ctx.fillStyle = "#b39257";
  ctx.beginPath();
  ctx.moveTo(0, canvas.height - 70);
  ctx.quadraticCurveTo(240, canvas.height - 110, 430, canvas.height - 75);
  ctx.quadraticCurveTo(670, canvas.height - 40, canvas.width, canvas.height - 92);
  ctx.lineTo(canvas.width, canvas.height);
  ctx.lineTo(0, canvas.height);
  ctx.closePath();
  ctx.fill();
}

function drawKelpBeds() {
  const kelpClusters = [
    { x: 80, height: 130, sway: 11 },
    { x: 160, height: 110, sway: 8 },
    { x: 510, height: 150, sway: 14 },
    { x: 740, height: 120, sway: 10 },
    { x: 890, height: 145, sway: 12 },
  ];

  kelpClusters.forEach((kelp) => {
    ctx.save();
    ctx.strokeStyle = "#144f2e";
    ctx.lineWidth = 7;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(kelp.x, canvas.height - 18);
    ctx.bezierCurveTo(
      kelp.x - kelp.sway,
      canvas.height - kelp.height * 0.5,
      kelp.x + kelp.sway,
      canvas.height - kelp.height * 0.75,
      kelp.x - 4,
      canvas.height - kelp.height
    );
    ctx.stroke();

    ctx.fillStyle = "#1f814a";
    for (let i = 0; i < 5; i += 1) {
      const leafY = canvas.height - kelp.height + i * 26;
      ctx.beginPath();
      ctx.ellipse(kelp.x + (i % 2 === 0 ? -10 : 10), leafY + 12, 11, 20, 0.4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  });
}

function drawBubbles() {
  ctx.save();
  ctx.fillStyle = "rgba(255,255,255,0.35)";
  const time = performance.now() * 0.001;
  const bubbleSeeds = [
    [120, 0.6],
    [370, 1.1],
    [630, 0.8],
    [830, 1.4],
  ];

  bubbleSeeds.forEach(([x, speed], index) => {
    for (let step = 0; step < 4; step += 1) {
      const y = (canvas.height - ((time * 40 * speed + step * 120 + index * 24) % canvas.height)) + 10;
      const offset = Math.sin(time + step + index) * 10;
      ctx.beginPath();
      ctx.arc(x + offset, y, 5 - step * 0.6, 0, Math.PI * 2);
      ctx.fill();
    }
  });
  ctx.restore();
}

function drawFishMarkers() {
  fishPlacements.forEach((fish) => {
    const discovered = answeredFishIds.has(fish.id);
    const isNearby = activeFish?.id === fish.id;

    ctx.save();
    ctx.translate(fish.worldX, fish.worldY);

    if (isNearby) {
      ctx.fillStyle = "rgba(124, 230, 213, 0.22)";
      ctx.beginPath();
      ctx.arc(0, 0, 34, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = discovered ? "#9be8c0" : "#7ce6d5";
    ctx.beginPath();
    ctx.ellipse(0, 0, 18, 10, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(15, 0);
    ctx.lineTo(28, -8);
    ctx.lineTo(28, 8);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "#043142";
    ctx.beginPath();
    ctx.arc(-6, -1, 2, 0, Math.PI * 2);
    ctx.fill();

    if (discovered) {
      ctx.fillStyle = "#032b37";
      ctx.font = "700 12px Manrope";
      ctx.textAlign = "center";
      ctx.fillText("Found", 0, -18);
    }

    ctx.restore();
  });
}

function detectNearbyFish() {
  activeFish = null;
  let closestDistance = Number.POSITIVE_INFINITY;

  fishPlacements.forEach((fish) => {
    const distance = Math.hypot(player.position.x - fish.worldX, player.position.y - fish.worldY);
    if (distance < 62 && distance < closestDistance) {
      activeFish = fish;
      closestDistance = distance;
    }
  });

  if (interactionLocked) {
    promptEl.textContent = "Quiz open. Answer the question or keep exploring.";
    return;
  }

  if (activeFish) {
    promptEl.textContent = `Press F to identify this creature: ${activeFish.locationHint}`;
  } else {
    promptEl.textContent = "Cruise through the bay, investigate glowing fish, and press F when you're close.";
  }
}

function openQuiz(fish) {
  interactionLocked = true;
  feedbackMessage.textContent = "";
  feedbackMessage.className = "feedback";
  fishImage.src = fish.imagePath;
  fishImage.alt = fish.name;
  fishLocation.textContent = fish.locationHint;
  learnMoreLink.href = fish.infoLink;
  answerButtons.innerHTML = "";
  const shuffledOptions = shuffleArray(fish.options);

  shuffledOptions.forEach((option, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "answer-button";
    button.textContent = `${String.fromCharCode(65 + index)}. ${option}`;
    button.addEventListener("click", () => handleAnswer(option, fish));
    answerButtons.appendChild(button);
  });

  modalEl.classList.remove("hidden");
}

function handleAnswer(selectedOption, fish) {
  const buttons = [...answerButtons.querySelectorAll(".answer-button")];
  buttons.forEach((button) => {
    button.disabled = true;
    const choice = button.textContent.slice(3);

    if (choice === fish.correctAnswer) {
      button.classList.add("correct");
    }

    if (choice === selectedOption && selectedOption !== fish.correctAnswer) {
      button.classList.add("incorrect");
    }
  });

  if (selectedOption === fish.correctAnswer) {
    feedbackMessage.textContent = "Correct! You identified the species.";
    feedbackMessage.className = "feedback success";
    answeredFishIds.add(fish.id);
  } else {
    feedbackMessage.textContent = `Incorrect. The right answer is ${fish.correctAnswer}.`;
    feedbackMessage.className = "feedback error";
  }
}

function closeQuiz() {
  modalEl.classList.add("hidden");
  interactionLocked = false;
}

function render() {
  drawBackground();
  drawFishMarkers();
  player.draw(ctx);
  detectNearbyFish();
}

function loop(timestamp) {
  const deltaTime = Math.min((timestamp - lastFrameTime) / 1000, 0.033);
  lastFrameTime = timestamp;

  if (!interactionLocked) {
    player.update(deltaTime, keys, world);
  }

  render();
  requestAnimationFrame(loop);
}

closeModalButton.addEventListener("click", closeQuiz);
keepExploringButton.addEventListener("click", closeQuiz);
modalEl.addEventListener("click", (event) => {
  if (event.target === modalEl) {
    closeQuiz();
  }
});

registerInput();
render();
requestAnimationFrame(loop);
