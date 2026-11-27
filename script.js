
/* =========================================================
   THE LITTLE WORLD WAITING FOR RAIN
   Complete animation engine

   00:00 - A quiet starry sky
   00:25 - Floating islands and little homes
   00:55 - A garden slowly comes alive
   01:25 - Shooting stars
   01:55 - Golden particles form a heart
   02:30 - The heart shines and the message appears
========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    "use strict";

    /* =====================================================
       ELEMENTS
    ===================================================== */

    const canvas = document.getElementById("world");
    const ctx = canvas.getContext("2d", { alpha: true });

    const introScreen = document.getElementById("introScreen");
    const beginButton = document.getElementById("beginButton");

    const finalScreen = document.getElementById("finalScreen");
    const replayButton = document.getElementById("replayButton");

    const topUI = document.getElementById("topUI");
    const progressContainer = document.getElementById("progressContainer");

    const progressFill = document.getElementById("progressFill");
    const sceneLabel = document.getElementById("sceneLabel");
    const timeLabel = document.getElementById("timeLabel");

    const musicButton = document.getElementById("musicButton");
    const musicIcon = document.getElementById("musicIcon");
    const musicLabel = document.getElementById("musicLabel");

    const music = document.getElementById("backgroundMusic");

    /* =====================================================
       SETTINGS
    ===================================================== */

    const TOTAL_DURATION = 180000;

    const MOBILE = window.matchMedia("(max-width: 600px)").matches;

    const STAR_COUNT = MOBILE ? 145 : 230;
    const FIREFLY_COUNT = MOBILE ? 24 : 42;
    const FLOWER_COUNT = MOBILE ? 15 : 25;
    const HEART_COUNT = MOBILE ? 470 : 760;

    let width = 0;
    let height = 0;
    let dpr = 1;

    let started = false;
    let finished = false;
    let musicPlaying = false;

    let startTime = 0;
    let elapsed = 0;

    let animationFrame = null;
    let musicFadeTimer = null;

    let stars = [];
    let fireflies = [];
    let shootingStars = [];
    let heartParticles = [];
    let flowers = [];

    /* =====================================================
       SCENE TIMELINE
    ===================================================== */

    const SCENES = [
        {
            time: 0,
            label: "A QUIET LITTLE BEGINNING"
        },
        {
            time: 25000,
            label: "A WORLD OF LITTLE WONDERS"
        },
        {
            time: 55000,
            label: "WHERE LITTLE THINGS BLOOM"
        },
        {
            time: 85000,
            label: "A SKY FULL OF WISHES"
        },
        {
            time: 115000,
            label: "MADE OF A THOUSAND LITTLE STARS"
        },
        {
            time: 150000,
            label: "A LITTLE FOREVER"
        }
    ];

    /* =====================================================
       MATHEMATICAL HELPERS
    ===================================================== */

    function random(min, max) {
        return Math.random() * (max - min) + min;
    }

    function clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    }

    function lerp(start, end, amount) {
        return start + (end - start) * amount;
    }

    function smoothstep(edge0, edge1, value) {

        const x = clamp(
            (value - edge0) / (edge1 - edge0),
            0,
            1
        );

        return x * x * (3 - 2 * x);
    }

    function easeOut(value) {
        const x = clamp(value, 0, 1);
        return 1 - Math.pow(1 - x, 3);
    }

    function easeInOut(value) {

        const x = clamp(value, 0, 1);

        return x < 0.5
            ? 4 * x * x * x
            : 1 - Math.pow(-2 * x + 2, 3) / 2;
    }

    function randomChoice(items) {
        return items[Math.floor(Math.random() * items.length)];
    }

    function formatTime(milliseconds) {

        const seconds = Math.floor(milliseconds / 1000);

        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;

        return (
            String(minutes).padStart(2, "0") +
            ":" +
            String(remainingSeconds).padStart(2, "0")
        );
    }

    /* =====================================================
       CANVAS RESIZING
    ===================================================== */

    function resizeCanvas() {

        const rect = canvas.getBoundingClientRect();

        width = Math.max(1, rect.width);
        height = Math.max(1, rect.height);

        dpr = Math.min(window.devicePixelRatio || 1, 1.7);

        canvas.width = Math.round(width * dpr);
        canvas.height = Math.round(height * dpr);

        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        createStars();
        createFireflies();
        createFlowers();
        createHeartParticles();

        if (finished) {
            drawFinalStill();
        }
    }

    /* =====================================================
       STARS
    ===================================================== */

    function createStars() {

        stars = [];

        for (let i = 0; i < STAR_COUNT; i++) {

            stars.push({

                x: random(0, width),
                y: random(0, height * 0.83),

                radius: random(0.35, 1.5),

                alpha: random(0.2, 0.85),

                speed: random(0.4, 1.5),

                phase: random(0, Math.PI * 2),

                gold: Math.random() > 0.78
            });
        }
    }

    function drawStars(time) {

        for (const star of stars) {

            const twinkle =
                Math.sin(time * star.speed + star.phase) * 0.5 + 0.5;

            const alpha = star.alpha * (0.48 + twinkle * 0.52);

            ctx.beginPath();

            ctx.fillStyle = star.gold
                ? `rgba(239, 208, 150, ${alpha})`
                : `rgba(218, 226, 255, ${alpha})`;

            ctx.arc(
                star.x,
                star.y,
                star.radius,
                0,
                Math.PI * 2
            );

            ctx.fill();

            if (star.radius > 1.15) {

                const glow = ctx.createRadialGradient(
                    star.x,
                    star.y,
                    0,
                    star.x,
                    star.y,
                    8
                );

                glow.addColorStop(
                    0,
                    `rgba(240, 219, 180, ${alpha * 0.3})`
                );

                glow.addColorStop(
                    1,
                    "rgba(240, 219, 180, 0)"
                );

                ctx.fillStyle = glow;

                ctx.beginPath();
                ctx.arc(star.x, star.y, 8, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }

    /* =====================================================
       MOON
    ===================================================== */

    function drawMoon(time) {

        const x = width * 0.78;
        const y = height * 0.19;

        const radius = Math.min(width, height) * 0.055;

        const breathing = 1 + Math.sin(time * 0.25) * 0.018;

        const glow = ctx.createRadialGradient(
            x,
            y,
            radius * 0.3,
            x,
            y,
            radius * 4.8
        );

        glow.addColorStop(
            0,
            "rgba(245, 220, 174, 0.13)"
        );

        glow.addColorStop(
            0.35,
            "rgba(224, 198, 155, 0.06)"
        );

        glow.addColorStop(
            1,
            "rgba(224, 198, 155, 0)"
        );

        ctx.fillStyle = glow;

        ctx.beginPath();
        ctx.arc(x, y, radius * 4.8, 0, Math.PI * 2);
        ctx.fill();

        ctx.save();

        ctx.translate(x, y);
        ctx.scale(breathing, breathing);

        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, Math.PI * 2);

        ctx.fillStyle = "rgba(247, 232, 201, 0.92)";

        ctx.shadowColor = "rgba(255, 229, 177, 0.6)";
        ctx.shadowBlur = 28;

        ctx.fill();

        ctx.shadowBlur = 0;

        /* Moon surface details */

        ctx.fillStyle = "rgba(173, 149, 112, 0.11)";

        ctx.beginPath();
        ctx.arc(-radius * 0.28, -radius * 0.1, radius * 0.16, 0, Math.PI * 2);
        ctx.fill();

        ctx.beginPath();
        ctx.arc(radius * 0.25, radius * 0.28, radius * 0.11, 0, Math.PI * 2);
        ctx.fill();

        ctx.beginPath();
        ctx.arc(radius * 0.36, -radius * 0.32, radius * 0.08, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    /* =====================================================
       HORIZON
    ===================================================== */

    function drawHorizon(time) {

        const baseY = height * 0.79;

        const horizonGlow = ctx.createLinearGradient(
            0,
            baseY - height * 0.18,
            0,
            height
        );

        horizonGlow.addColorStop(0, "rgba(42, 56, 87, 0)");
        horizonGlow.addColorStop(0.55, "rgba(31, 45, 73, 0.23)");
        horizonGlow.addColorStop(1, "rgba(11, 19, 39, 0.95)");

        ctx.fillStyle = horizonGlow;

        ctx.fillRect(
            0,
            baseY - height * 0.18,
            width,
            height * 0.25
        );

        ctx.beginPath();
        ctx.moveTo(0, baseY + 10);

        for (let x = 0; x <= width + 20; x += 20) {

            const wave =
                Math.sin(x * 0.006 + time * 0.08) * 7 +
                Math.sin(x * 0.013 - time * 0.04) * 4;

            ctx.lineTo(x, baseY + wave);
        }

        ctx.lineTo(width, height);
        ctx.lineTo(0, height);
        ctx.closePath();

        const ground = ctx.createLinearGradient(
            0,
            baseY,
            0,
            height
        );

        ground.addColorStop(0, "#17243c");
        ground.addColorStop(0.35, "#101a30");
        ground.addColorStop(1, "#080e20");

        ctx.fillStyle = ground;
        ctx.fill();
    }

    /* =====================================================
       FLOATING ISLANDS
    ===================================================== */

    function drawIsland(x, y, size, time, delay = 0) {

        const bob = Math.sin(time * 0.45 + delay) * 5;

        y += bob;

        ctx.save();
        ctx.translate(x, y);

        /* Island shadow */

        const shadow = ctx.createRadialGradient(
            0,
            size * 0.3,
            0,
            0,
            size * 0.3,
            size * 1.2
        );

        shadow.addColorStop(0, "rgba(0, 0, 0, 0.28)");
        shadow.addColorStop(1, "rgba(0, 0, 0, 0)");

        ctx.fillStyle = shadow;

        ctx.beginPath();
        ctx.ellipse(
            0,
            size * 0.5,
            size * 1.2,
            size * 0.35,
            0,
            0,
            Math.PI * 2
        );

        ctx.fill();

        /* Island surface */

        ctx.beginPath();
        ctx.moveTo(-size, 0);

        ctx.bezierCurveTo(
            -size * 0.85,
            -size * 0.28,
            size * 0.55,
            -size * 0.35,
            size,
            0
        );

        ctx.bezierCurveTo(
            size * 0.75,
            size * 0.32,
            -size * 0.75,
            size * 0.28,
            -size,
            0
        );

        const topGradient = ctx.createLinearGradient(
            0,
            -size * 0.2,
            0,
            size * 0.2
        );

        topGradient.addColorStop(0, "#52647b");
        topGradient.addColorStop(1, "#273a54");

        ctx.fillStyle = topGradient;
        ctx.fill();

        /* Island underside */

        ctx.beginPath();

        ctx.moveTo(-size * 0.78, size * 0.08);
        ctx.lineTo(-size * 0.35, size * 0.9);
        ctx.lineTo(0, size * 1.1);
        ctx.lineTo(size * 0.45, size * 0.82);
        ctx.lineTo(size * 0.82, size * 0.08);

        ctx.closePath();

        const underside = ctx.createLinearGradient(
            0,
            size * 0.1,
            0,
            size
        );

        underside.addColorStop(0, "#263852");
        underside.addColorStop(1, "#101a31");

        ctx.fillStyle = underside;
        ctx.fill();

        /* Stable grass details */

        ctx.strokeStyle = "rgba(180, 196, 151, 0.42)";
        ctx.lineWidth = 1.3;

        for (let i = 0; i < 9; i++) {

            const grassX = Math.sin(i * 12.9898 + size) * size * 0.72;

            const grassHeight =
                8 + Math.abs(Math.sin(i * 7.31)) * 7;

            const grassLean = Math.sin(i * 3.17) * 5;

            ctx.beginPath();

            ctx.moveTo(grassX, 0);

            ctx.quadraticCurveTo(
                grassX + grassLean * 0.5,
                -grassHeight * 0.55,
                grassX + grassLean,
                -grassHeight
            );

            ctx.stroke();
        }

        ctx.restore();
    }

    /* =====================================================
       LITTLE HOUSES
    ===================================================== */

    function drawHouse(x, y, scale, time, lantern = true) {

        ctx.save();

        ctx.translate(x, y);
        ctx.scale(scale, scale);

        /* House body */

        ctx.fillStyle = "#334157";
        ctx.fillRect(-18, -25, 36, 26);

        /* Roof */

        ctx.beginPath();

        ctx.moveTo(-24, -24);
        ctx.lineTo(0, -46);
        ctx.lineTo(24, -24);

        ctx.closePath();

        ctx.fillStyle = "#202d43";
        ctx.fill();

        ctx.strokeStyle = "rgba(228, 198, 151, 0.32)";
        ctx.lineWidth = 1;

        ctx.stroke();

        /* Warm windows */

        const windowGlow = 0.65 + Math.sin(time * 1.4 + x) * 0.12;

        ctx.fillStyle = `rgba(255, 205, 119, ${windowGlow})`;

        ctx.fillRect(-7, -17, 7, 9);
        ctx.fillRect(5, -17, 7, 9);

        ctx.shadowColor = "rgba(255, 191, 94, 0.7)";
        ctx.shadowBlur = 12;

        ctx.fillRect(-7, -17, 7, 9);
        ctx.fillRect(5, -17, 7, 9);

        ctx.shadowBlur = 0;

        /* Door */

        ctx.fillStyle = "#18263a";
        ctx.fillRect(-4, -13, 8, 14);

        /* Lantern */

        if (lantern) {

            const lanternPulse =
                0.7 + Math.sin(time * 2 + x) * 0.2;

            const glow = ctx.createRadialGradient(
                28,
                -9,
                0,
                28,
                -9,
                27
            );

            glow.addColorStop(
                0,
                `rgba(255, 202, 116, ${0.35 * lanternPulse})`
            );

            glow.addColorStop(
                1,
                "rgba(255, 202, 116, 0)"
            );

            ctx.fillStyle = glow;

            ctx.beginPath();
            ctx.arc(28, -9, 27, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = "#f8dba7";

            ctx.beginPath();
            ctx.arc(28, -9, 2.4, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }

    /* =====================================================
       TREES
    ===================================================== */

    function drawTree(x, y, scale) {

        ctx.save();

        ctx.translate(x, y);
        ctx.scale(scale, scale);

        ctx.fillStyle = "#293a48";
        ctx.fillRect(-2, -17, 4, 18);

        const colors = [
            "#405b59",
            "#3a554f",
            "#50665c"
        ];

        for (let i = 0; i < 3; i++) {

            ctx.beginPath();

            ctx.moveTo(0, -43 + i * 12);

            ctx.lineTo(-13 + i * 3, -13 + i * 9);
            ctx.lineTo(13 - i * 3, -13 + i * 9);

            ctx.closePath();

            ctx.fillStyle = colors[i];
            ctx.fill();
        }

        ctx.restore();
    }

    /* =====================================================
       ISLAND SCENE
    ===================================================== */

    function drawIslandScene(time, progress) {

        const reveal = smoothstep(0, 1, progress);

        ctx.save();
        ctx.globalAlpha = reveal;

        const centerY = height * 0.57;

        const mainSize = Math.min(width * 0.22, 145);

        const leftBob = Math.sin(time * 0.45 + 0.4) * 5;
        const rightBob = Math.sin(time * 0.45 + 2) * 5;
        const lowerBob = Math.sin(time * 0.45 + 4) * 5;

        drawIsland(
            width * 0.22,
            centerY + 10,
            mainSize * 0.82,
            time,
            0.4
        );

        drawIsland(
            width * 0.77,
            centerY - 20,
            mainSize * 0.72,
            time,
            2
        );

        drawIsland(
            width * 0.51,
            centerY + height * 0.17,
            mainSize * 0.58,
            time,
            4
        );

        /* Houses */

        drawHouse(
            width * 0.22,
            centerY - 5 + leftBob,
            mainSize / 105,
            time,
            true
        );

        drawHouse(
            width * 0.77,
            centerY - 40 + rightBob,
            mainSize / 130,
            time,
            true
        );

        /* Trees */

        drawTree(
            width * 0.15,
            centerY + 5 + leftBob,
            mainSize / 110
        );

        drawTree(
            width * 0.29,
            centerY + 8 + leftBob,
            mainSize / 130
        );

        drawTree(
            width * 0.71,
            centerY - 25 + rightBob,
            mainSize / 140
        );

        drawTree(
            width * 0.83,
            centerY - 25 + rightBob,
            mainSize / 125
        );

        ctx.restore();
    }

    /* =====================================================
       FIREFLIES
    ===================================================== */

    function createFireflies() {

        fireflies = [];

        for (let i = 0; i < FIREFLY_COUNT; i++) {

            fireflies.push({

                x: random(0, width),
                y: random(height * 0.35, height * 0.9),

                baseX: random(0, width),
                baseY: random(height * 0.35, height * 0.9),

                radius: random(1, 2.5),

                speed: random(0.3, 1.1),

                phase: random(0, Math.PI * 2),

                drift: random(8, 30)
            });
        }
    }

    function drawFireflies(time, progress) {

        const visibility = smoothstep(0, 0.5, progress);

        if (visibility <= 0) return;

        ctx.save();
        ctx.globalAlpha = visibility;

        for (const fly of fireflies) {

            const x =
                fly.baseX +
                Math.sin(time * fly.speed + fly.phase) * fly.drift;

            const y =
                fly.baseY +
                Math.cos(time * fly.speed * 0.8 + fly.phase) *
                fly.drift * 0.6;

            const pulse =
                0.35 +
                (Math.sin(time * 2 + fly.phase) + 1) * 0.3;

            const glow = ctx.createRadialGradient(
                x,
                y,
                0,
                x,
                y,
                fly.radius * 7
            );

            glow.addColorStop(
                0,
                `rgba(255, 221, 151, ${pulse})`
            );

            glow.addColorStop(
                1,
                "rgba(255, 221, 151, 0)"
            );

            ctx.fillStyle = glow;

            ctx.beginPath();
            ctx.arc(x, y, fly.radius * 7, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = `rgba(255, 239, 194, ${pulse})`;

            ctx.beginPath();
            ctx.arc(x, y, fly.radius, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }

    /* =====================================================
       FLOWERS
    ===================================================== */

    function createFlowers() {

        flowers = [];

        const colors = [
            "rgba(243, 207, 179, 0.9)",
            "rgba(237, 218, 177, 0.9)",
            "rgba(219, 197, 208, 0.9)",
            "rgba(245, 227, 195, 0.9)"
        ];

        for (let i = 0; i < FLOWER_COUNT; i++) {

            flowers.push({

                x: random(width * 0.08, width * 0.92),
                y: random(height * 0.78, height * 0.98),

                size: random(3.5, 7),

                delay: random(0, 0.45),

                petals: Math.floor(random(5, 8)),

                color: randomChoice(colors)
            });
        }
    }

    function drawFlower(flower, growth) {

        const localGrowth = clamp(
            (growth - flower.delay) / (1 - flower.delay),
            0,
            1
        );

        if (localGrowth <= 0) return;

        const size = flower.size * easeOut(localGrowth);

        ctx.save();

        ctx.translate(flower.x, flower.y);

        /* Stem */

        ctx.strokeStyle = "rgba(113, 153, 115, 0.65)";
        ctx.lineWidth = 1.2;

        ctx.beginPath();

        ctx.moveTo(0, 0);

        ctx.quadraticCurveTo(
            -3,
            -size * 3,
            0,
            -size * 5
        );

        ctx.stroke();

        /* Leaves */

        ctx.fillStyle = "rgba(94, 135, 100, 0.8)";

        ctx.beginPath();

        ctx.ellipse(
            -size * 1.2,
            -size * 2,
            size * 1.2,
            size * 0.45,
            -0.4,
            0,
            Math.PI * 2
        );

        ctx.fill();

        ctx.beginPath();

        ctx.ellipse(
            size * 1.1,
            -size * 3,
            size * 1.1,
            size * 0.4,
            0.4,
            0,
            Math.PI * 2
        );

        ctx.fill();

        /* Petals */

        ctx.translate(0, -size * 5);

        ctx.rotate(Math.sin(localGrowth * Math.PI) * 0.15);

        for (let i = 0; i < flower.petals; i++) {

            const angle =
                (Math.PI * 2 / flower.petals) * i;

            ctx.save();
            ctx.rotate(angle);

            ctx.beginPath();

            ctx.ellipse(
                0,
                -size * 0.65,
                size * 0.42,
                size * 0.78,
                0,
                0,
                Math.PI * 2
            );

            ctx.fillStyle = flower.color;
            ctx.fill();

            ctx.restore();
        }

        /* Flower center */

        ctx.beginPath();
        ctx.arc(0, 0, size * 0.32, 0, Math.PI * 2);

        ctx.fillStyle = "#e7c47e";

        ctx.shadowColor = "rgba(240, 204, 134, 0.8)";
        ctx.shadowBlur = 8;

        ctx.fill();

        ctx.restore();
    }

    function drawGarden(time, progress) {

        const growth = smoothstep(0, 1, progress);

        if (growth <= 0) return;

        ctx.save();

        ctx.globalAlpha = growth;

        /* Garden ground */

        const groundY = height * 0.92;

        const ground = ctx.createLinearGradient(
            0,
            groundY - 30,
            0,
            height
        );

        ground.addColorStop(0, "rgba(39, 64, 61, 0)");
        ground.addColorStop(1, "rgba(21, 43, 45, 0.8)");

        ctx.fillStyle = ground;

        ctx.fillRect(
            0,
            groundY - 30,
            width,
            height - groundY + 30
        );

        for (const flower of flowers) {
            drawFlower(flower, growth);
        }

        ctx.restore();
    }

    /* =====================================================
       SHOOTING STARS
    ===================================================== */

    function createShootingStar() {

        const fromLeft = Math.random() > 0.5;

        const x = fromLeft
            ? random(-100, width * 0.5)
            : random(width * 0.5, width + 100);

        const y = random(20, height * 0.45);

        const direction = fromLeft ? 1 : -1;

        shootingStars.push({

            x,
            y,

            vx: direction * random(5, 9),
            vy: random(2.1, 4.2),

            life: 0,
            maxLife: random(35, 55),

            length: random(65, 115)
        });
    }

    function drawShootingStars() {

        for (let i = shootingStars.length - 1; i >= 0; i--) {

            const star = shootingStars[i];

            star.x += star.vx;
            star.y += star.vy;

            star.life++;

            const life = star.life / star.maxLife;

            const opacity = Math.sin(life * Math.PI);

            const tailX = star.x - star.vx * star.length * 0.12;
            const tailY = star.y - star.vy * star.length * 0.12;

            const gradient = ctx.createLinearGradient(
                star.x,
                star.y,
                tailX,
                tailY
            );

            gradient.addColorStop(
                0,
                `rgba(255, 240, 207, ${opacity})`
            );

            gradient.addColorStop(
                0.25,
                `rgba(239, 205, 151, ${opacity * 0.55})`
            );

            gradient.addColorStop(
                1,
                "rgba(239, 205, 151, 0)"
            );

            ctx.beginPath();

            ctx.moveTo(star.x, star.y);
            ctx.lineTo(tailX, tailY);

            ctx.strokeStyle = gradient;
            ctx.lineWidth = 2;

            ctx.stroke();

            ctx.beginPath();
            ctx.arc(star.x, star.y, 2, 0, Math.PI * 2);

            ctx.fillStyle = `rgba(255, 248, 224, ${opacity})`;
            ctx.fill();

            if (star.life >= star.maxLife) {
                shootingStars.splice(i, 1);
            }
        }
    }

    /* =====================================================
       HEART SHAPE
    ===================================================== */

    function heartPoint(t) {

        const x = 16 * Math.pow(Math.sin(t), 3);

        const y =
            13 * Math.cos(t) -
            5 * Math.cos(2 * t) -
            2 * Math.cos(3 * t) -
            Math.cos(4 * t);

        return { x, y };
    }

    /* =====================================================
       HEART PARTICLES
    ===================================================== */

    function createHeartParticles() {

        heartParticles = [];

        const colors = [
            [255, 235, 190],
            [245, 211, 155],
            [229, 188, 126],
            [255, 246, 220]
        ];

        for (let i = 0; i < HEART_COUNT; i++) {

            const t = Math.random() * Math.PI * 2;

            const point = heartPoint(t);

            const fill = Math.sqrt(Math.random());

            const spread = 1 + random(-0.04, 0.04);

            heartParticles.push({

                startX: random(-width * 0.1, width * 1.1),
                startY: random(-height * 0.1, height * 1.1),

                targetX: point.x * fill * spread,
                targetY: point.y * fill * spread,

                size: random(0.7, 2.1),

                delay: random(0, 0.32),

                phase: random(0, Math.PI * 2),

                speed: random(0.7, 1.5),

                color: randomChoice(colors)
            });
        }
    }

    function drawHeart(time, progress) {

        const formation = smoothstep(0, 1, progress);

        if (formation <= 0) return;

        const heartSize = Math.min(
            width * (MOBILE ? 0.022 : 0.027),
            height * 0.025
        );

        const centerX = width * 0.5;
        const centerY = height * (MOBILE ? 0.48 : 0.47);

        /* Heart glow */

        const glowRadius = heartSize * 29;

        const glow = ctx.createRadialGradient(
            centerX,
            centerY,
            heartSize,
            centerX,
            centerY,
            glowRadius
        );

        glow.addColorStop(
            0,
            `rgba(238, 194, 128, ${0.11 * formation})`
        );

        glow.addColorStop(
            0.45,
            `rgba(208, 165, 115, ${0.055 * formation})`
        );

        glow.addColorStop(
            1,
            "rgba(208, 165, 115, 0)"
        );

        ctx.fillStyle = glow;

        ctx.beginPath();
        ctx.arc(centerX, centerY, glowRadius, 0, Math.PI * 2);
        ctx.fill();

        /* Particles travel into the heart */

        for (const particle of heartParticles) {

            const individualProgress = smoothstep(
                particle.delay,
                particle.delay + 0.68,
                formation
            );

            const targetX =
                centerX + particle.targetX * heartSize;

            const targetY =
                centerY - particle.targetY * heartSize;

            const drift =
                Math.sin(time * particle.speed + particle.phase) *
                (1 - individualProgress) * 12;

            const x = lerp(
                particle.startX,
                targetX,
                individualProgress
            ) + drift;

            const y = lerp(
                particle.startY,
                targetY,
                individualProgress
            );

            const pulse =
                0.65 +
                Math.sin(time * 1.7 + particle.phase) * 0.25;

            const opacity = formation * pulse;

            const [red, green, blue] = particle.color;

            ctx.beginPath();

            ctx.fillStyle =
                `rgba(${red}, ${green}, ${blue}, ${opacity})`;

            ctx.arc(
                x,
                y,
                particle.size * (0.7 + individualProgress * 0.45),
                0,
                Math.PI * 2
            );

            ctx.fill();

            /* Individual particle glow */

            if (particle.size > 1.5) {

                const particleGlow = ctx.createRadialGradient(
                    x,
                    y,
                    0,
                    x,
                    y,
                    particle.size * 5
                );

                particleGlow.addColorStop(
                    0,
                    `rgba(255, 224, 173, ${opacity * 0.35})`
                );

                particleGlow.addColorStop(
                    1,
                    "rgba(255, 224, 173, 0)"
                );

                ctx.fillStyle = particleGlow;

                ctx.beginPath();

                ctx.arc(
                    x,
                    y,
                    particle.size * 5,
                    0,
                    Math.PI * 2
                );

                ctx.fill();
            }
        }

        /* Sparkles around the finished heart */

        if (formation > 0.65) {

            const sparkleAmount = smoothstep(
                0.65,
                0.9,
                formation
            );

            for (let i = 0; i < 14; i++) {

                const angle =
                    (Math.PI * 2 / 14) * i +
                    time * 0.045;

                const radius = heartSize * 17;

                const x = centerX + Math.cos(angle) * radius;

                const y = centerY +
                    Math.sin(angle) * radius * 0.78;

                const twinkle = Math.max(
                    0,
                    Math.sin(time * 2.2 + i * 1.7)
                );

                const alpha = twinkle * sparkleAmount * 0.8;

                ctx.beginPath();

                ctx.arc(
                    x,
                    y,
                    1.5 + twinkle,
                    0,
                    Math.PI * 2
                );

                ctx.fillStyle = `rgba(255, 235, 190, ${alpha})`;
                ctx.fill();
            }
        }
    }

    /* =====================================================
       BACKGROUND COMPOSITION
    ===================================================== */

    function drawSky(time) {

        const sky = ctx.createLinearGradient(
            0,
            0,
            0,
            height
        );

        sky.addColorStop(0, "#070b1b");
        sky.addColorStop(0.45, "#101b35");
        sky.addColorStop(0.78, "#18243a");
        sky.addColorStop(1, "#0b1428");

        ctx.fillStyle = sky;
        ctx.fillRect(0, 0, width, height);

        /* Distant atmospheric glow */

        const atmosphere = ctx.createRadialGradient(
            width * 0.5,
            height * 0.7,
            0,
            width * 0.5,
            height * 0.7,
            height * 0.8
        );

        atmosphere.addColorStop(
            0,
            "rgba(65, 86, 118, 0.13)"
        );

        atmosphere.addColorStop(
            1,
            "rgba(65, 86, 118, 0)"
        );

        ctx.fillStyle = atmosphere;
        ctx.fillRect(0, 0, width, height);

        drawStars(time);
        drawMoon(time);
        drawHorizon(time);
    }

    /* =====================================================
       TIMELINE HELPERS
    ===================================================== */

    function getSceneProgress(time, start, end) {

        return clamp(
            (time - start) / (end - start),
            0,
            1
        );
    }

    function updateSceneLabel(time) {

        let currentScene = SCENES[0];

        for (const scene of SCENES) {

            if (time >= scene.time) {
                currentScene = scene;
            }
        }

        sceneLabel.textContent = currentScene.label;
    }

    /* =====================================================
       MAIN RENDER LOOP
    ===================================================== */

    function render(timestamp) {

        if (!started || finished) return;

        elapsed = Math.min(
            timestamp - startTime,
            TOTAL_DURATION
        );

        const time = elapsed / 1000;
        const progress = elapsed / TOTAL_DURATION;

        /* Update progress */

        progressFill.style.width = `${progress * 100}%`;

        timeLabel.textContent = formatTime(elapsed);

        updateSceneLabel(elapsed);

        /* Draw the sky */

        drawSky(time);

        /* Floating islands */

        if (elapsed >= 25000 && elapsed < 120000) {

            const islandProgress = getSceneProgress(
                elapsed,
                25000,
                55000
            );

            const islandFadeOut = 1 - smoothstep(
                105000,
                120000,
                elapsed
            );

            ctx.save();

            ctx.globalAlpha = islandFadeOut;

            drawIslandScene(time, islandProgress);

            ctx.restore();
        }

        /* Garden */

        if (elapsed >= 55000 && elapsed < 125000) {

            const gardenProgress = getSceneProgress(
                elapsed,
                55000,
                85000
            );

            drawGarden(time, gardenProgress);
        }

        /* Fireflies */

        if (elapsed >= 55000 && elapsed < 150000) {

            drawFireflies(
                time,
                getSceneProgress(elapsed, 55000, 85000)
            );
        }

        /* Shooting stars */

        if (elapsed >= 85000 && elapsed < 155000) {

            if (Math.random() < (MOBILE ? 0.012 : 0.018)) {
                createShootingStar();
            }

            drawShootingStars();
        }

        /* Heart formation */

        if (elapsed >= 115000) {

            const heartProgress = getSceneProgress(
                elapsed,
                115000,
                150000
            );

            drawHeart(time, heartProgress);
        }

        /* End */

        if (elapsed >= TOTAL_DURATION) {

            finishExperience();

            return;
        }

        animationFrame = requestAnimationFrame(render);
    }

    /* =====================================================
       FINAL ANIMATION
    ===================================================== */

    function drawFinalStill() {

        const time = performance.now() / 1000;

        ctx.clearRect(0, 0, width, height);

        drawSky(time);
        drawHeart(time, 1);
    }

    function finalAnimation(timestamp) {

        if (!finished) return;

        ctx.clearRect(0, 0, width, height);

        const time = timestamp / 1000;

        drawSky(time);
        drawHeart(time, 1);

        animationFrame = requestAnimationFrame(finalAnimation);
    }

    function finishExperience() {

        if (finished) return;

        finished = true;
        started = false;

        elapsed = TOTAL_DURATION;

        progressFill.style.width = "100%";
        timeLabel.textContent = formatTime(TOTAL_DURATION);

        sceneLabel.textContent = "ALWAYS, FOR RAIN ♡";

        finalScreen.classList.add("visible");
        finalScreen.setAttribute("aria-hidden", "false");

        animationFrame = requestAnimationFrame(finalAnimation);
    }

    /* =====================================================
       MUSIC CONTROLS
    ===================================================== */

    function clearMusicFade() {

        if (musicFadeTimer !== null) {

            clearInterval(musicFadeTimer);

            musicFadeTimer = null;
        }
    }

    async function startMusic() {

        clearMusicFade();

        try {

            music.volume = 0;

            await music.play();

            musicPlaying = true;

            musicLabel.textContent = "SOUND ON";
            musicIcon.textContent = "♫";

            let volume = 0;

            musicFadeTimer = setInterval(() => {

                if (!musicPlaying) {

                    clearMusicFade();

                    return;
                }

                volume = Math.min(volume + 0.025, 0.42);

                music.volume = volume;

                if (volume >= 0.42) {
                    clearMusicFade();
                }

            }, 100);

        } catch (error) {

            musicPlaying = false;

            musicLabel.textContent = "SOUND OFF";
            musicIcon.textContent = "♫";

            console.info(
                "Music unavailable. The animation will continue.",
                error
            );
        }
    }

    function stopMusic() {

        clearMusicFade();

        musicPlaying = false;

        music.pause();
        music.currentTime = 0;
        music.volume = 0;

        musicLabel.textContent = "SOUND OFF";
        musicIcon.textContent = "♫";
    }

    async function toggleMusic() {

        if (musicPlaying) {

            stopMusic();

        } else {

            await startMusic();
        }
    }

    /* =====================================================
       START EXPERIENCE
    ===================================================== */

    function startExperience() {

        if (started) return;

        if (finished) {
            resetExperience();
        }

        cancelAnimationFrame(animationFrame);

        started = true;
        finished = false;

        elapsed = 0;
        startTime = performance.now();

        shootingStars = [];

        introScreen.classList.add("is-hidden");

        topUI.classList.add("visible");
        progressContainer.classList.add("visible");

        finalScreen.classList.remove("visible");
        finalScreen.setAttribute("aria-hidden", "true");

        progressFill.style.width = "0%";

        timeLabel.textContent = "00:00";
        sceneLabel.textContent = SCENES[0].label;

        /* Start music without blocking the animation */

        startMusic();

        animationFrame = requestAnimationFrame(render);
    }

    /* =====================================================
       REPLAY / RESET
    ===================================================== */

    function resetExperience() {

        cancelAnimationFrame(animationFrame);

        started = false;
        finished = false;

        elapsed = 0;
        startTime = 0;

        shootingStars = [];

        stopMusic();

        finalScreen.classList.remove("visible");
        finalScreen.setAttribute("aria-hidden", "true");

        topUI.classList.remove("visible");
        progressContainer.classList.remove("visible");

        introScreen.classList.remove("is-hidden");

        progressFill.style.width = "0%";

        timeLabel.textContent = "00:00";
        sceneLabel.textContent = SCENES[0].label;

        resizeCanvas();
    }

    /* =====================================================
       EVENT LISTENERS
    ===================================================== */

    beginButton.addEventListener("click", startExperience);

    replayButton.addEventListener("click", resetExperience);

    musicButton.addEventListener("click", toggleMusic);

    window.addEventListener("resize", resizeCanvas);

    /* =====================================================
       INITIALIZATION
    ===================================================== */

    resizeCanvas();

    ctx.clearRect(0, 0, width, height);

    drawSky(0);

});
