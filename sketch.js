
let capture;
let posenet;
let singlePose;

// Player
let playerX, playerY;
let smoothNoseX;           // lerped nose X for smooth movement
const PLAYER_RADIUS = 22;

// Obstacles
let obstacles = [];
let obstacleTimer = 0;
let spawnInterval = 90;    // frames between spawns (decreases over time)
const OBS_W = 40;
const OBS_H = 20;

// Game state
let score = 0;
let gameOver = false;
let started = false;       // wait until pose is detected once

// Difficulty ramp
let speed = 3;
let frameCount_ = 0;       // manual frame counter (avoid p5 global conflict)


function setup() {
  createCanvas(640, 480);
  textFont('monospace');

  capture = createCapture(VIDEO);
  capture.size(640, 480);
  capture.hide();

  posenet = ml5.poseNet(capture, { flipHorizontal: true }, modelLoaded);
  posenet.on('pose', receivedPoses);

  playerY = height - 60;
  playerX = width / 2;
  smoothNoseX = width / 2;
}


function modelLoaded() {
  console.log('PoseNet ready');
}

function receivedPoses(poses) {
  if (poses.length > 0) {
    singlePose = poses[0].pose;
    started = true;

    // Nose X drives player — mirror it (video is flipped)
    let rawX = width - singlePose.nose.x;

    // Smooth with lerp to kill jitter
    smoothNoseX = lerp(smoothNoseX, rawX, 0.15);
  }
}


function draw() {
  // Draw webcam feed as background (semi-transparent for game feel)
  tint(255, 180);
  image(capture, 0, 0, width, height);
  noTint();

  // Dark overlay for readability
  fill(0, 0, 0, 100);
  noStroke();
  rect(0, 0, width, height);

  if (!started) {
    drawWaitingScreen();
    return;
  }

  if (!gameOver) {
    frameCount_++;
    updateGame();
  }

  drawObstacles();
  drawPlayer();
  drawHUD();

  if (gameOver) drawGameOver();
}


function updateGame() {
  // Move player to nose position, clamped to canvas
  playerX = constrain(smoothNoseX, PLAYER_RADIUS, width - PLAYER_RADIUS);

  // Difficulty ramp: speed up every 300 frames, spawn faster every 500
  speed = 3 + floor(frameCount_ / 300) * 0.8;
  if (frameCount_ % 500 === 0 && spawnInterval > 35) {
    spawnInterval -= 8;
  }

  // Spawn obstacles
  obstacleTimer++;
  if (obstacleTimer >= spawnInterval) {
    spawnObstacle();
    obstacleTimer = 0;
  }

  // Update obstacles
  for (let i = obstacles.length - 1; i >= 0; i--) {
    obstacles[i].y += obstacles[i].speed;

    // Remove off-screen, increment score
    if (obstacles[i].y > height + OBS_H) {
      obstacles.splice(i, 1);
      score++;
      continue;
    }

    // Collision check (circle vs rect)
    if (circleRectCollide(playerX, playerY, PLAYER_RADIUS,
                          obstacles[i].x, obstacles[i].y,
                          obstacles[i].w, OBS_H)) {
      gameOver = true;
    }
  }
}

function spawnObstacle() {
  let w = random(30, 90);
  obstacles.push({
    x: random(w / 2, width - w / 2),
    y: -OBS_H,
    w: w,
    speed: speed + random(-0.5, 1.5)
  });
}


function circleRectCollide(cx, cy, cr, rx, ry, rw, rh) {
  // Nearest point on rect to circle center
  let nearX = constrain(cx, rx - rw / 2, rx + rw / 2);
  let nearY = constrain(cy, ry - rh / 2, ry + rh / 2);
  let dx = cx - nearX;
  let dy = cy - nearY;
  return (dx * dx + dy * dy) < (cr * cr);
}


function drawPlayer() {
  // Glow ring
  noFill();
  for (let i = 3; i > 0; i--) {
    stroke(0, 255, 180, 40 * i);
    strokeWeight(i * 3);
    ellipse(playerX, playerY, PLAYER_RADIUS * 2 + i * 4);
  }

  // Player body
  fill(0, 255, 180);
  stroke(255);
  strokeWeight(2);
  ellipse(playerX, playerY, PLAYER_RADIUS * 2);

  // Nose indicator dot
  if (singlePose) {
    fill(255, 255, 0, 180);
    noStroke();
    ellipse(playerX, playerY - 4, 8);
  }
}

function drawObstacles() {
  for (let obs of obstacles) {
    // Warning color gets more red as it gets lower
    let danger = map(obs.y, 0, height, 0, 255);

    fill(255, 80 + danger * 0.3, 0, 220);
    stroke(255, 200, 0);
    strokeWeight(1.5);
    rectMode(CENTER);
    rect(obs.x, obs.y, obs.w, OBS_H, 4);
    rectMode(CORNER);
  }
}

function drawHUD() {
  // Score
  fill(255);
  noStroke();
  textSize(16);
  textAlign(LEFT);
  text('SCORE  ' + score, 16, 28);

  // Speed indicator
  textAlign(RIGHT);
  text('SPEED  ' + nf(speed, 1, 1) + 'x', width - 16, 28);

  // Pose confidence
  if (singlePose) {
    let conf = floor(singlePose.nose.confidence * 100);
    textAlign(LEFT);
    textSize(11);
    fill(conf > 60 ? color(0, 255, 180) : color(255, 100, 0));
    text('nose confidence: ' + conf + '%', 16, height - 12);
  }
}

function drawWaitingScreen() {
  fill(255);
  noStroke();
  textAlign(CENTER);
  textSize(22);
  text('Stand in front of camera', width / 2, height / 2 - 20);
  textSize(14);
  fill(180);
  text('PoseNet is detecting your nose position...', width / 2, height / 2 + 16);
}

function drawGameOver() {
  // Overlay
  fill(0, 0, 0, 160);
  noStroke();
  rect(0, 0, width, height);

  fill(255, 80, 80);
  noStroke();
  textAlign(CENTER);
  textSize(42);
  text('GAME OVER', width / 2, height / 2 - 40);

  fill(255);
  textSize(20);
  text('Score: ' + score, width / 2, height / 2 + 10);

  fill(0, 255, 180);
  textSize(14);
  text('Press  R  to restart', width / 2, height / 2 + 50);
}


function keyPressed() {
  if ((key === 'r' || key === 'R') && gameOver) {
    obstacles = [];
    obstacleTimer = 0;
    spawnInterval = 90;
    score = 0;
    speed = 3;
    frameCount_ = 0;
    gameOver = false;
  }
}