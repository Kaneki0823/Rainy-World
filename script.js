
/* =====================================================
   THE LITTLE WORLD WAITING FOR RAIN
   CINEMATIC ANIMATION ENGINE
   ===================================================== */

"use strict";

/* =====================================================
   CONFIGURATION
   ===================================================== */

const CONFIG = {
    duration: 180000,

    sceneTimes: [
        0,
        25000,
        55000,
        85000,
        115000,
        150000,
        180000
    ],

    sceneNames: [
        "THE QUIET BEGINNING",
        "A WORLD COMES ALIVE",
        "THE GARDEN OF LIGHT",
        "A THOUSAND WISHES",
        "EVERY STAR FINDS ITS PLACE",
        "FOR YOU, RAIN"
    ],

    backgroundStars: 180,
    heartParticles: 1500,

    musicVolume: 0.42
};


/* =====================================================
   ELEMENTS
   ===================================================== */

const beginButton = document.getElementById("beginButton");

const music = document.getElementById("music");
const musicControl = document.getElementById("musicControl");
const musicIcon = document.getElementById("musicIcon");
const musicText = document.getElementById("musicText");

const timeline = document.getElementById("timeline");
const timelineProgress = document.getElementById("timelineProgress");
const timelineLabel = document.getElementById("timelineLabel");

const starCanvas = document.getElementById("starCanvas");
const starContext = starCanvas.getContext("2d");

const heartCanvas = document.getElementById("heartCanvas");
const heartContext = heartCanvas.getContext("2d");

const shootingStarField =
    document.getElementById("shootingStarField");

const flowerField =
    document.getElementById("flowerField");

const fireflyField =
    document.getElementById("fireflyField");


/* =====================================================
   STATE
   ===================================================== */

let started = false;
let musicPlaying = false;
let musicMuted = false;

let startTime = 0;
let elapsed = 0;

let currentScene = 0;

let animationFrame = null;
let shootingInterval = null;

let lastResize = 0;

const scenes = [
    document.getElementById("scene1"),
    document.getElementById("scene2"),
    document.getElementById("scene3"),
    document.getElementById("scene4"),
    document.getElementById("scene5"),
    document.getElementById("scene6")
];


/* =====================================================
   RESPONSIVE CANVAS SETUP
   ===================================================== */

let screenWidth = window.innerWidth;
let screenHeight = window.innerHeight;

let dpr = Math.min(
    window.devicePixelRatio || 1,
    2
);

function setupCanvas(canvas, context) {

    const width = window.innerWidth;
    const height = window.innerHeight;

    const ratio = Math.min(
        window.devicePixelRatio || 1,
        2
    );

    canvas.width = width * ratio;
    canvas.height = height * ratio;

    canvas.style.width = width + "px";
    canvas.style.height = height + "px";

    context.setTransform(
        ratio,
        0,
        0,
        ratio,
        0,
        0
    );

    return {
        width,
        height,
        ratio
    };

}

function resizeAll() {

    const dimensions = setupCanvas(
        starCanvas,
        starContext
    );

    screenWidth = dimensions.width;
    screenHeight = dimensions.height;
    dpr = dimensions.ratio;

    setupCanvas(
        heartCanvas,
        heartContext
    );

    if (heartInitialized) {
        createHeartParticles();
    }

}

resizeAll();


/* =====================================================
   AUDIO SYSTEM
   ===================================================== */

music.volume = 0;

async function startMusic() {

    try {

        await music.play();

        musicPlaying = true;
        musicMuted = false;

        musicControl.classList.add("playing");

        musicIcon.textContent = "♪";
        musicText.textContent = "MUSIC ON";

        fadeMusic(CONFIG.musicVolume, 5000);

    } catch (error) {

        console.warn(
            "Music could not autoplay. Use the music button."
        );

        musicText.textContent = "TAP FOR MUSIC";

    }

}

function fadeMusic(target, duration) {

    const startingVolume = music.volume;
    const beginning = performance.now();

    function fade(now) {

        const progress = Math.min(
            (now - beginning) / duration,
            1
        );

        const eased =
            1 - Math.pow(1 - progress, 3);

        music.volume =
            startingVolume +
            (target - startingVolume) * eased;

        if (progress < 1) {
            requestAnimationFrame(fade);
        }

    }

    requestAnimationFrame(fade);

}

musicControl.addEventListener("click", async () => {

    if (!musicPlaying || music.paused) {

        try {

            await music.play();

            musicPlaying = true;
            musicMuted = false;

            musicControl.classList.add("playing");

            musicIcon.textContent = "♪";
            musicText.textContent = "MUSIC ON";

            fadeMusic(CONFIG.musicVolume, 1200);

        } catch (error) {

            musicText.textContent = "UNAVAILABLE";

        }

    } else {

        musicMuted = !musicMuted;

        if (musicMuted) {

            fadeMusic(0, 600);

            setTimeout(() => {
                music.pause();
            }, 650);

            musicControl.classList.remove("playing");

            musicIcon.textContent = "♫";
            musicText.textContent = "MUSIC OFF";

        }

    }

});


/* =====================================================
   INTRODUCTION
   ===================================================== */

beginButton.addEventListener("click", async () => {

    if (started) return;

    started = true;

    beginButton.disabled = true;

    beginButton.innerHTML =
        "<span>Our little world begins...</span>";

    musicControl.classList.add("visible");

    timeline.classList.add("visible");

    startMusic();

    startTime = performance.now();

    // Remove the welcome screen.

    document.getElementById("intro")
        .classList.remove("active");

    // Activate the first animated scene.

    scenes[0].classList.add("active");

    // Begin the background universe.

    initializeBackgroundStars();

    initializeGarden();

    initializeFireflies();

    requestAnimationFrame(mainLoop);

});


/* =====================================================
   MAIN TIMELINE
   ===================================================== */

function mainLoop(timestamp) {

    if (!started) return;

    elapsed = timestamp - startTime;

    const progress = Math.min(
        elapsed / CONFIG.duration,
        1
    );

    updateTimeline(progress);

    updateScene();

    animateBackgroundStars(timestamp);

    if (heartInitialized) {
        animateHeart(timestamp);
    }

    if (elapsed >= CONFIG.duration) {

        finishExperience();

        return;

    }

    animationFrame = requestAnimationFrame(mainLoop);

}


/* =====================================================
   TIMELINE DISPLAY
   ===================================================== */

function updateTimeline(progress) {

    timelineProgress.style.width =
        (progress * 100) + "%";

    const sceneIndex = Math.min(
        Math.floor(elapsed / 25000),
        5
    );

    timelineLabel.textContent =
        CONFIG.sceneNames[sceneIndex];

}


/* =====================================================
   SCENE TRANSITIONS
   ===================================================== */

function updateScene() {

    let nextScene = 0;

    for (let i = 0; i < CONFIG.sceneTimes.length - 1; i++) {

        if (
            elapsed >= CONFIG.sceneTimes[i] &&
            elapsed < CONFIG.sceneTimes[i + 1]
        ) {

            nextScene = i;

            break;

        }

    }

    if (nextScene !== currentScene) {

        transitionToScene(nextScene);

    }

}

function transitionToScene(index) {

    currentScene = index;

    scenes.forEach((scene, i) => {

        if (i === index) {

            scene.classList.remove("exiting");

            scene.classList.add("active");

        } else {

            scene.classList.remove("active");

        }

    });

    // Scene-specific effects.

    if (index === 2) {

        growGarden();

    }

    if (index === 3) {

        startShootingStars();

    }

    if (index === 4) {

        startHeartFormation();

    }

    if (index === 5) {

        revealFinalMessage();

    }

}


/* =====================================================
   BACKGROUND STAR PARTICLES
   ===================================================== */

let backgroundStars = [];

function initializeBackgroundStars() {

    backgroundStars = [];

    const count = screenWidth < 600
        ? 110
        : CONFIG.backgroundStars;

    for (let i = 0; i < count; i++) {

        backgroundStars.push({

            x: Math.random() * screenWidth,
            y: Math.random() * screenHeight,

            size: Math.random() * 1.7 + .3,

            alpha: Math.random() * .65 + .2,

            phase: Math.random() * Math.PI * 2,

            speed: Math.random() * .12 + .025,

            drift: Math.random() * .15 - .075

        });

    }

}

function animateBackgroundStars(timestamp) {

    starContext.clearRect(
        0,
        0,
        screenWidth,
        screenHeight
    );

    const time = timestamp * .001;

    backgroundStars.forEach(star => {

        star.y += star.speed;
        star.x += star.drift;

        if (star.y > screenHeight + 5) {

            star.y = -5;
            star.x = Math.random() * screenWidth;

        }

        if (star.x < 0) star.x = screenWidth;
        if (star.x > screenWidth) star.x = 0;

        const twinkle =
            Math.sin(time * 1.3 + star.phase) * .25;

        const alpha = Math.max(
            .05,
            star.alpha + twinkle
        );

        starContext.beginPath();

        starContext.arc(
            star.x,
            star.y,
            star.size,
            0,
            Math.PI * 2
        );

        starContext.fillStyle =
            `rgba(247,224,188,${alpha})`;

        starContext.fill();

    });

}


/* =====================================================
   FLOWER GARDEN GENERATOR
   ===================================================== */

const flowerColors = [
    "#e9b6b0",
    "#d9b5cc",
    "#e8d2a1",
    "#c7b5df",
    "#e6a8a6",
    "#e5c2b2",
    "#d7c3dc"
];

function initializeGarden() {

    flowerField.innerHTML = "";

    const flowerCount = screenWidth < 600 ? 15 : 23;

    for (let i = 0; i < flowerCount; i++) {

        const plant = document.createElement("div");

        plant.className = "flower-plant";

        const height =
            105 + Math.random() * 145;

        const color =
            flowerColors[
                Math.floor(Math.random() * flowerColors.length)
            ];

        plant.style.setProperty(
            "--height",
            height + "px"
        );

        plant.style.setProperty(
            "--petal",
            color
        );

        plant.style.setProperty(
            "--sway",
            (3 + Math.random() * 3) + "s"
        );

        plant.style.opacity =
            .65 + Math.random() * .35;

        plant.style.transitionDelay =
            (Math.random() * 2.5) + "s";

        const stem = document.createElement("div");
        stem.className = "flower-stem";

        const leftLeaf = document.createElement("div");
        leftLeaf.className = "flower-leaf left";

        const rightLeaf = document.createElement("div");
        rightLeaf.className = "flower-leaf right";

        const head = document.createElement("div");
        head.className = "flower-head";

        for (let p = 0; p < 6; p++) {

            const petal = document.createElement("i");

            petal.className = "flower-petal";

            head.appendChild(petal);

        }

        const center = document.createElement("div");
        center.className = "flower-center";

        head.appendChild(center);

        plant.appendChild(stem);
        plant.appendChild(leftLeaf);
        plant.appendChild(rightLeaf);
        plant.appendChild(head);

        flowerField.appendChild(plant);

    }

}

function growGarden() {

    const plants = [
        ...document.querySelectorAll(".flower-plant")
    ];

    plants.forEach((plant, index) => {

        setTimeout(() => {

            plant.classList.add("grow");

        }, index * 90);

    });

}


/* =====================================================
   FIREFLIES
   ===================================================== */

function initializeFireflies() {

    fireflyField.innerHTML = "";

    const count = screenWidth < 600 ? 25 : 45;

    for (let i = 0; i < count; i++) {

        const firefly = document.createElement("div");

        firefly.className = "firefly";

        firefly.style.left =
            Math.random() * 100 + "%";

        firefly.style.top =
            Math.random() * 100 + "%";

        firefly.style.setProperty(
            "--duration",
            (3 + Math.random() * 5) + "s"
        );

        firefly.style.setProperty(
            "--dx",
            (Math.random() * 110 - 55) + "px"
        );

        firefly.style.setProperty(
            "--dy",
            (Math.random() * 100 - 50) + "px"
        );

        firefly.style.animationDelay =
            (-Math.random() * 5) + "s";

        fireflyField.appendChild(firefly);

    }

}


/* =====================================================
   SHOOTING STARS
   ===================================================== */

function createShootingStar() {

    const star = document.createElement("div");

    star.className = "shooting-star";

    star.style.left =
        (Math.random() * 115 + 10) + "%";

    star.style.top =
        (Math.random() * 65) + "%";

    star.style.setProperty(
        "--length",
        (45 + Math.random() * 100) + "px"
    );

    star.style.setProperty(
        "--speed",
        (1.3 + Math.random() * 1.8) + "s"
    );

    shootingStarField.appendChild(star);

    setTimeout(() => {

        star.remove();

    }, 3500);

}

function startShootingStars() {

    if (shootingInterval) return;

    for (let i = 0; i < 5; i++) {

        setTimeout(
            createShootingStar,
            i * 450
        );

    }

    shootingInterval = setInterval(() => {

        createShootingStar();

    }, screenWidth < 600 ? 1250 : 800);

}


/* =====================================================
   HEART CONSTELLATION
   ===================================================== */

let heartParticles = [];

let heartInitialized = false;
let heartComplete = false;

let heartStartTime = 0;

let heartFormationProgress = 0;

const HEART_COUNT = CONFIG.heartParticles;


/* HEART MATHEMATICAL EQUATION */

function heartPoint(t) {

    return {

        x: 16 * Math.pow(Math.sin(t), 3),

        y:
            13 * Math.cos(t) -
            5 * Math.cos(2 * t) -
            2 * Math.cos(3 * t) -
            Math.cos(4 * t)

    };

}


/* GENERATE PARTICLES */

function createHeartParticles() {

    heartParticles = [];

    const mobile = screenWidth < 600;

    const scale = Math.min(
        screenWidth * (mobile ? .019 : .022),
        screenHeight * .0125
    );

    const centerX = screenWidth / 2;
    const centerY = screenHeight * .42;

    for (let i = 0; i < HEART_COUNT; i++) {

        const t = Math.random() * Math.PI * 2;

        const point = heartPoint(t);

        // The square root distribution creates
        // a more even filling inside the heart.

        const fill = Math.sqrt(Math.random());

        const targetX =
            centerX + point.x * scale * fill;

        const targetY =
            centerY - point.y * scale * fill;

        const angle =
            Math.random() * Math.PI * 2;

        const distance =
            Math.max(screenWidth, screenHeight) *
            (.5 + Math.random() * .6);

        const startX =
            centerX + Math.cos(angle) * distance;

        const startY =
            centerY + Math.sin(angle) * distance;

        heartParticles.push({

            x: startX,
            y: startY,

            targetX,
            targetY,

            size: .5 + Math.random() * 1.8,

            alpha: .5 + Math.random() * .5,

            phase: Math.random() * Math.PI * 2,

            twinkle: 1 + Math.random() * 2,

            speed: .015 + Math.random() * .025,

            sparkle: Math.random() > .94

        });

    }

}


/* START FORMATION */

function startHeartFormation() {

    if (heartInitialized) return;

    heartInitialized = true;

    heartComplete = false;

    heartStartTime = performance.now();

    heartCanvas.classList.add("visible");

    createHeartParticles();

}


/* DRAW HEART PARTICLES */

function animateHeart(timestamp) {

    if (!heartInitialized) return;

    const time = timestamp * .001;

    // Formation lasts around 15 seconds.

    const formationDuration = 15000;

    heartFormationProgress = Math.min(
        (timestamp - heartStartTime) / formationDuration,
        1
    );

    // Smooth cinematic acceleration.

    const eased =
        1 - Math.pow(1 - heartFormationProgress, 3);

    heartContext.clearRect(
        0,
        0,
        screenWidth,
        screenHeight
    );

    let totalArrived = 0;

    heartParticles.forEach(particle => {

        const driftX =
            Math.sin(time * .6 + particle.phase) * 2.3;

        const driftY =
            Math.cos(time * .7 + particle.phase) * 2.3;

        const destinationX =
            particle.targetX + driftX;

        const destinationY =
            particle.targetY + driftY;

        const movement =
            particle.speed + eased * .055;

        particle.x +=
            (destinationX - particle.x) * movement;

        particle.y +=
            (destinationY - particle.y) * movement;

        const distance = Math.hypot(
            destinationX - particle.x,
            destinationY - particle.y
        );

        if (distance < 4) {
            totalArrived++;
        }

        const twinkle =
            Math.sin(time * particle.twinkle + particle.phase);

        const opacity = Math.max(
            .1,
            particle.alpha * (.75 + twinkle * .2)
        );

        // Main glow.

        heartContext.beginPath();

        heartContext.arc(
            particle.x,
            particle.y,
            particle.size * 3.3,
            0,
            Math.PI * 2
        );

        heartContext.fillStyle =
            `rgba(236,190,116,${opacity * .12})`;

        heartContext.fill();

        // Main star.

        heartContext.beginPath();

        heartContext.arc(
            particle.x,
            particle.y,
            particle.size,
            0,
            Math.PI * 2
        );

        heartContext.fillStyle =
            `rgba(255,237,204,${opacity})`;

        heartContext.fill();

        // Brighter sparkle stars.

        if (particle.sparkle && heartFormationProgress > .25) {

            heartContext.save();

            heartContext.translate(
                particle.x,
                particle.y
            );

            heartContext.rotate(time * .3);

            heartContext.strokeStyle =
                `rgba(255,235,192,${opacity * .65})`;

            heartContext.lineWidth = .6;

            heartContext.beginPath();

            heartContext.moveTo(-5, 0);
            heartContext.lineTo(5, 0);

            heartContext.moveTo(0, -5);
            heartContext.lineTo(0, 5);

            heartContext.stroke();

            heartContext.restore();

        }

    });


    // Connect a portion of nearby stars
    // to create a constellation-like structure.

    if (heartFormationProgress > .55) {

        const connectionCount = 190;

        heartContext.lineWidth = .45;

        for (let i = 0; i < connectionCount; i++) {

            const a = heartParticles[i];

            const b = heartParticles[
                (i + 1) % connectionCount
            ];

            const distance = Math.hypot(
                a.x - b.x,
                a.y - b.y
            );

            if (distance < 45) {

                heartContext.beginPath();

                heartContext.moveTo(a.x, a.y);

                heartContext.lineTo(b.x, b.y);

                heartContext.strokeStyle =
                    `rgba(232,197,139,${.14 * eased})`;

                heartContext.stroke();

            }

        }

    }


    // Soft heart-shaped glow behind the particles.

    if (heartFormationProgress > .85) {

        const pulse =
            1 + Math.sin(time * 1.5) * .035;

        heartContext.save();

        heartContext.globalCompositeOperation =
            "lighter";

        heartContext.beginPath();

        heartContext.arc(
            screenWidth / 2,
            screenHeight * .42,
            8 * pulse,
            0,
            Math.PI * 2
        );

        heartContext.fillStyle =
            "rgba(245,207,145,.07)";

        heartContext.fill();

        heartContext.restore();

    }


    // Formation complete.

    if (
        heartFormationProgress >= 1 &&
        !heartComplete &&
        totalArrived > HEART_COUNT * .65
    ) {

        heartComplete = true;

        console.log("The heart constellation is complete.");

    }

}


/* =====================================================
   FINAL MESSAGE
   ===================================================== */

function revealFinalMessage() {

    document.getElementById("scene6")
        .classList.add("active");

    timelineLabel.textContent =
        "FOR YOU, RAIN";

}


/* =====================================================
   FINISH EXPERIENCE
   ===================================================== */

function finishExperience() {

    elapsed = CONFIG.duration;

    timelineProgress.style.width = "100%";

    timelineLabel.textContent =
        "ALWAYS, FOR RAIN ♡";

    // Keep the final heart and message visible.

    if (animationFrame) {
        cancelAnimationFrame(animationFrame);
    }

    if (shootingInterval) {
        clearInterval(shootingInterval);
        shootingInterval = null;
    }

}


/* =====================================================
   RESIZE HANDLING
   ===================================================== */

window.addEventListener("resize", () => {

    const now = performance.now();

    if (now - lastResize < 150) return;

    lastResize = now;

    resizeAll();

    if (started) {

        initializeBackgroundStars();

    }

});


/* =====================================================
   INITIAL STATE
   ===================================================== */

document.getElementById("intro")
    .classList.add("active");

musicControl.classList.remove("visible");

timeline.classList.remove("visible");

console.log(
    "The Little World Waiting for Rain is ready. ♡"
);
