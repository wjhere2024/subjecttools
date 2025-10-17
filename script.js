const canvas = document.getElementById('mainCanvas');
const ctx = canvas.getContext('2d');

const prevBtn = document.getElementById('prevBtn');
const playBtn = document.getElementById('playBtn');
const nextBtn = document.getElementById('nextBtn');
const resetBtn = document.getElementById('resetBtn');
const stepTitle = document.getElementById('stepTitle');
const stepDescription = document.getElementById('stepDescription');

let currentStep = 0;
let isPlaying = false;
let autoPlayInterval = null;
let animationState = null;
let animationFrameId = null;

const CANVAS_WIDTH = 900;
const CANVAS_HEIGHT = 500;
const ANIMATION_DURATION = 1200;

canvas.width = CANVAS_WIDTH;
canvas.height = CANVAS_HEIGHT;

const steps = [
    {
        title: '场景一：大象上船',
        description: '大象走上船，船身下沉，在船身上标记水位线。观察船身如何因为大象的重量而下沉。',
        elephantOnBoat: true,
        boatSinkLevel: 60,
        showWaterMark: true,
        stonesOnBoat: [],
        showWorkers: false,
        showScale: false,
        weight: 0
    },
    {
        title: '场景二：大象下船，装载石头',
        description: '大象离开船，工人们开始往船上搬运石头。注意水位线标记仍然在船身上。',
        elephantOnBoat: false,
        boatSinkLevel: 20,
        showWaterMark: true,
        stonesOnBoat: [1, 2, 3, 4, 5, 6],
        showWorkers: true,
        showScale: false,
        weight: 0
    },
    {
        title: '场景三：石头装满，船身下沉',
        description: '继续装载石头，直到船下沉到之前标记的水位线。这时船受到的浮力与装大象时完全相同。',
        elephantOnBoat: false,
        boatSinkLevel: 60,
        showWaterMark: true,
        stonesOnBoat: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
        showWorkers: false,
        showScale: false,
        weight: 0
    },
    {
        title: '场景四：称量石头重量',
        description: '将船上的石头逐一称重，把所有石头的重量相加，就得到了大象的重量！',
        elephantOnBoat: false,
        boatSinkLevel: 20,
        showWaterMark: true,
        stonesOnBoat: [],
        showWorkers: false,
        showScale: true,
        weight: 5000
    }
];

const WATER_MARK_REFERENCE = steps[0].boatSinkLevel;

function lerp(start, end, t) {
    return start + (end - start) * t;
}

function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function buildStateFromStep(stepIndex) {
    const data = steps[stepIndex];
    return {
        boatSinkLevel: data.boatSinkLevel,
        showWaterMark: data.showWaterMark,
        elephantAlpha: data.elephantOnBoat ? 1 : 0,
        stonesCount: data.stonesOnBoat.length,
        workersAlpha: data.showWorkers ? 1 : 0,
        scaleAlpha: data.showScale ? 1 : 0,
        scaleWeight: data.weight || 0
    };
}

function interpolateState(fromIndex, toIndex, progress) {
    const from = steps[fromIndex];
    const to = steps[toIndex];
    const eased = easeInOutCubic(progress);

    return {
        boatSinkLevel: lerp(from.boatSinkLevel, to.boatSinkLevel, eased),
        showWaterMark: from.showWaterMark || to.showWaterMark,
        elephantAlpha: lerp(from.elephantOnBoat ? 1 : 0, to.elephantOnBoat ? 1 : 0, eased),
        stonesCount: lerp(from.stonesOnBoat.length, to.stonesOnBoat.length, eased),
        workersAlpha: lerp(from.showWorkers ? 1 : 0, to.showWorkers ? 1 : 0, eased),
        scaleAlpha: lerp(from.showScale ? 1 : 0, to.showScale ? 1 : 0, eased),
        scaleWeight: lerp(from.weight || 0, to.weight || 0, eased)
    };
}

function drawBackground() {
    const gradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
    gradient.addColorStop(0, '#87CEEB');
    gradient.addColorStop(0.5, '#B0E0E6');
    gradient.addColorStop(1, '#4682B4');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    ctx.fillStyle = '#228B22';
    ctx.fillRect(0, CANVAS_HEIGHT - 60, CANVAS_WIDTH, 60);
}

function drawWater(boatY) {
    const waterLevel = boatY + 80;

    ctx.fillStyle = 'rgba(30, 144, 255, 0.65)';
    ctx.fillRect(0, waterLevel, CANVAS_WIDTH, CANVAS_HEIGHT - waterLevel);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        const yOffset = waterLevel + i * 15;
        for (let x = 0; x <= CANVAS_WIDTH; x += 20) {
            const wave = Math.sin((x + Date.now() * 0.0015 * (i + 1)) * 0.05) * 3;
            const y = yOffset + wave;
            if (x === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        ctx.stroke();
    }
}

function drawBoat(x, y, sinkLevel) {
    const boatY = y + sinkLevel;

    ctx.fillStyle = '#8B4513';
    ctx.strokeStyle = '#654321';
    ctx.lineWidth = 3;

    ctx.beginPath();
    ctx.moveTo(x - 110, boatY + 80);
    ctx.lineTo(x - 140, boatY + 110);
    ctx.lineTo(x + 140, boatY + 110);
    ctx.lineTo(x + 110, boatY + 80);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#A0522D';
    ctx.fillRect(x - 110, boatY + 30, 220, 50);
    ctx.strokeRect(x - 110, boatY + 30, 220, 50);

    ctx.strokeStyle = '#5C3317';
    ctx.lineWidth = 2;
    for (let i = 0; i <= 5; i++) {
        ctx.beginPath();
        ctx.moveTo(x - 90 + i * 45, boatY + 30);
        ctx.lineTo(x - 90 + i * 45, boatY + 80);
        ctx.stroke();
    }

    return boatY;
}

function drawWaterMark(x, referenceY) {
    ctx.save();
    ctx.strokeStyle = '#FF0000';
    ctx.lineWidth = 4;
    ctx.setLineDash([14, 8]);
    ctx.beginPath();
    ctx.moveTo(x - 110, referenceY + 80);
    ctx.lineTo(x + 110, referenceY + 80);
    ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.fillStyle = '#FF0000';
    ctx.font = 'bold 16px "Microsoft YaHei", Arial';
    ctx.textBaseline = 'middle';
    ctx.fillText('水位线', x + 125, referenceY + 82);
    ctx.restore();
}

function drawElephant(x, y) {
    ctx.fillStyle = '#6C6C6C';

    ctx.beginPath();
    ctx.ellipse(x, y - 18, 50, 38, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(x - 12, y - 50, 28, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(x - 20, y - 55, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x - 6, y - 55, 6, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(x - 20, y - 55, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x - 6, y - 55, 2.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#6C6C6C';
    ctx.lineWidth = 12;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x - 12, y - 30);
    ctx.quadraticCurveTo(x - 32, y - 8, x - 35, y + 15);
    ctx.stroke();

    for (let i = 0; i < 4; i++) {
        const legX = x - 34 + i * 22;
        ctx.fillStyle = '#6C6C6C';
        ctx.fillRect(legX, y, 14, 32);
        ctx.fillStyle = '#808080';
        ctx.fillRect(legX, y + 28, 14, 6);
    }

    ctx.fillStyle = '#6C6C6C';
    ctx.beginPath();
    ctx.moveTo(x + 32, y - 40);
    ctx.quadraticCurveTo(x + 60, y - 30, x + 56, y - 6);
    ctx.lineTo(x + 32, y - 15);
    ctx.closePath();
    ctx.fill();
}

function drawStone(x, y, size = 20, alpha = 1) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#6D7B8D';
    ctx.strokeStyle = '#2F4F4F';
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.moveTo(x, y - size);
    ctx.lineTo(x + size * 0.85, y - size * 0.45);
    ctx.lineTo(x + size * 0.95, y + size * 0.25);
    ctx.lineTo(x, y + size);
    ctx.lineTo(x - size * 0.95, y + size * 0.25);
    ctx.lineTo(x - size * 0.85, y - size * 0.45);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
}

function drawWorker(x, y) {
    ctx.save();

    ctx.fillStyle = '#FFD15C';
    ctx.beginPath();
    ctx.arc(x, y - 48, 12, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#1E73BE';
    ctx.fillRect(x - 11, y - 35, 22, 28);

    ctx.strokeStyle = '#1E73BE';
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x - 11, y - 28);
    ctx.lineTo(x - 22, y - 15);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x + 11, y - 28);
    ctx.lineTo(x + 22, y - 15);
    ctx.stroke();

    ctx.fillStyle = '#0D3B66';
    ctx.fillRect(x - 9, y - 8, 7, 22);
    ctx.fillRect(x + 2, y - 8, 7, 22);

    ctx.restore();
}

function drawScale(x, y, weight) {
    ctx.save();

    ctx.fillStyle = '#C0C0C0';
    ctx.fillRect(x - 45, y, 90, 70);
    ctx.strokeStyle = '#7F8C8D';
    ctx.lineWidth = 3;
    ctx.strokeRect(x - 45, y, 90, 70);

    ctx.fillStyle = '#F8F9FA';
    ctx.fillRect(x - 35, y + 10, 70, 40);
    ctx.strokeStyle = '#BDC3C7';
    ctx.lineWidth = 2;
    ctx.strokeRect(x - 35, y + 10, 70, 40);

    ctx.fillStyle = '#FF4757';
    ctx.font = 'bold 20px "Microsoft YaHei", Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${Math.round(weight)}kg`, x, y + 30);

    ctx.fillStyle = '#2C3E50';
    ctx.font = '14px "Microsoft YaHei", Arial';
    ctx.fillText('电子秤', x, y - 12);

    ctx.restore();
}

function drawBoatStones(boatX, boatActualY, stonesCount) {
    if (stonesCount <= 0) {
        return;
    }

    const stonesPerRow = 4;
    const fullStones = Math.floor(stonesCount);
    const remainder = stonesCount - fullStones;

    for (let i = 0; i < fullStones; i++) {
        const row = Math.floor(i / stonesPerRow);
        const col = i % stonesPerRow;
        const stoneX = boatX - 65 + col * 45;
        const stoneY = boatActualY + 68 - row * 28;
        drawStone(stoneX, stoneY, 18, 1);
    }

    if (remainder > 0) {
        const index = fullStones;
        const row = Math.floor(index / stonesPerRow);
        const col = index % stonesPerRow;
        const stoneX = boatX - 65 + col * 45;
        const stoneY = boatActualY + 68 - row * 28;
        drawStone(stoneX, stoneY, 18, remainder);
    }
}

function drawGroundScene(workersAlpha) {
    if (workersAlpha <= 0) {
        return;
    }

    ctx.save();
    ctx.globalAlpha = workersAlpha;

    drawWorker(210, CANVAS_HEIGHT - 110);
    drawWorker(CANVAS_WIDTH - 210, CANVAS_HEIGHT - 110);

    drawStone(190, CANVAS_HEIGHT - 130, 18, 0.9);
    drawStone(730, CANVAS_HEIGHT - 130, 18, 0.9);
    drawStone(225, CANVAS_HEIGHT - 125, 15, 0.7);
    drawStone(695, CANVAS_HEIGHT - 125, 15, 0.7);

    ctx.restore();
}

function drawScaleArea(scaleAlpha, weight) {
    if (scaleAlpha <= 0) {
        return;
    }

    ctx.save();
    ctx.globalAlpha = scaleAlpha;
    drawScale(220, CANVAS_HEIGHT - 180, weight);

    for (let i = 0; i < 6; i++) {
        const row = Math.floor(i / 3);
        const col = i % 3;
        const stoneX = 360 + col * 45;
        const stoneY = CANVAS_HEIGHT - 140 - row * 30;
        drawStone(stoneX, stoneY, 18, 0.95);
    }

    ctx.restore();
}

function drawSceneState(state) {
    drawBackground();

    const boatX = CANVAS_WIDTH / 2;
    const baseBoatY = 190;
    const boatActualY = drawBoat(boatX, baseBoatY, state.boatSinkLevel);

    drawWater(boatActualY);

    if (state.showWaterMark) {
        drawWaterMark(boatX, baseBoatY + WATER_MARK_REFERENCE - state.boatSinkLevel);
    }

    if (state.elephantAlpha > 0) {
        ctx.save();
        ctx.globalAlpha = Math.min(state.elephantAlpha, 1);
        drawElephant(boatX, boatActualY + 42);
        ctx.restore();
    }

    drawBoatStones(boatX, boatActualY, state.stonesCount);
    drawGroundScene(state.workersAlpha);
    drawScaleArea(state.scaleAlpha, state.scaleWeight);
}

function drawScene(stepIndex) {
    const state = buildStateFromStep(stepIndex);
    drawSceneState(state);
}

function cancelCurrentAnimation() {
    if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }
    animationState = null;
}

function animateFrame(timestamp) {
    if (!animationState) {
        return;
    }

    const { fromIndex, toIndex, startTime, duration } = animationState;
    const elapsed = timestamp - startTime;
    const progress = Math.min(1, elapsed / duration);

    const interpolatedState = interpolateState(fromIndex, toIndex, progress);
    drawSceneState(interpolatedState);

    if (progress < 1) {
        animationFrameId = requestAnimationFrame(animateFrame);
    } else {
        cancelCurrentAnimation();
        drawScene(currentStep);
    }
}

function startAnimation(fromIndex, toIndex) {
    cancelCurrentAnimation();
    animationState = {
        fromIndex,
        toIndex,
        startTime: performance.now(),
        duration: ANIMATION_DURATION
    };
    animationFrameId = requestAnimationFrame(animateFrame);
}

function updateStepInfo() {
    stepTitle.textContent = steps[currentStep].title;
    stepDescription.textContent = steps[currentStep].description;

    document.querySelectorAll('.progress-step').forEach((stepItem, index) => {
        stepItem.classList.remove('active', 'completed');
        if (index === currentStep) {
            stepItem.classList.add('active');
        } else if (index < currentStep) {
            stepItem.classList.add('completed');
        }
    });
}

function updateButtons() {
    prevBtn.disabled = currentStep === 0;
    nextBtn.disabled = currentStep === steps.length - 1;
}

function goToStep(step, options = {}) {
    if (step < 0 || step >= steps.length) {
        return;
    }

    const fromStep = currentStep;
    const skipAnimation = options.skipAnimation || fromStep === step;

    currentStep = step;
    updateStepInfo();
    updateButtons();

    if (skipAnimation) {
        cancelCurrentAnimation();
        drawScene(currentStep);
        return;
    }

    startAnimation(fromStep, currentStep);
}

function nextStep() {
    if (currentStep < steps.length - 1) {
        goToStep(currentStep + 1);
    } else if (isPlaying) {
        stopAutoPlay();
    }
}

function prevStep() {
    if (currentStep > 0) {
        goToStep(currentStep - 1);
    }
}

function resetDemo() {
    stopAutoPlay();
    goToStep(0, { skipAnimation: true });
}

function startAutoPlay() {
    if (isPlaying) {
        stopAutoPlay();
        return;
    }

    isPlaying = true;
    playBtn.textContent = '⏸️ 暂停播放';
    playBtn.classList.remove('btn-play');
    playBtn.classList.add('btn-pause');

    autoPlayInterval = setInterval(() => {
        if (currentStep < steps.length - 1) {
            nextStep();
        } else {
            stopAutoPlay();
        }
    }, 3200);
}

function stopAutoPlay() {
    if (!isPlaying) {
        return;
    }

    isPlaying = false;
    playBtn.textContent = '▶️ 自动播放';
    playBtn.classList.remove('btn-pause');
    playBtn.classList.add('btn-play');

    if (autoPlayInterval) {
        clearInterval(autoPlayInterval);
        autoPlayInterval = null;
    }
}

prevBtn.addEventListener('click', () => {
    stopAutoPlay();
    prevStep();
});

nextBtn.addEventListener('click', () => {
    stopAutoPlay();
    nextStep();
});

playBtn.addEventListener('click', startAutoPlay);
resetBtn.addEventListener('click', resetDemo);

window.addEventListener('DOMContentLoaded', () => {
    goToStep(0, { skipAnimation: true });
});

window.addEventListener('resize', () => {
    drawScene(currentStep);
});
