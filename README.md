<div align="center">

<br />

```
███╗   ██╗ ██████╗ ███████╗███████╗    ██████╗  ██████╗ ██████╗  ██████╗ ███████╗
████╗  ██║██╔═══██╗██╔════╝██╔════╝    ██╔══██╗██╔═══██╗██╔══██╗██╔════╝ ██╔════╝
██╔██╗ ██║██║   ██║███████╗█████╗      ██║  ██║██║   ██║██║  ██║██║  ███╗█████╗  
██║╚██╗██║██║   ██║╚════██║██╔══╝      ██║  ██║██║   ██║██║  ██║██║   ██║██╔══╝  
██║ ╚████║╚██████╔╝███████║███████╗    ██████╔╝╚██████╔╝██████╔╝╚██████╔╝███████╗
╚═╝  ╚═══╝ ╚═════╝ ╚══════╝╚══════╝    ╚═════╝  ╚═════╝ ╚═════╝  ╚═════╝╚══════╝
```

**A real-time body-controlled dodge game powered by PoseNet + p5.js**  
*Your nose is the controller. No keyboard. No mouse. Just move.*

<br />

[![Live Demo](https://img.shields.io/badge/▶%20Play%20Live-00ffb4?style=for-the-badge&logoColor=black)](https://srajan2006.github.io/Nose-Dodge-Game/)
[![p5.js](https://img.shields.io/badge/p5.js-1.9.0-ED225D?style=for-the-badge&logo=p5dotjs&logoColor=white)](https://p5js.org/)
[![ml5.js](https://img.shields.io/badge/ml5.js-0.12.2-blueviolet?style=for-the-badge)](https://ml5js.org/)
[![License](https://img.shields.io/badge/license-MIT-blue?style=for-the-badge)](LICENSE)

<br />

</div>

---

## What is this?

Nose Dodge is a browser game where your **body is the controller**. A PoseNet model tracks your nose in real time via webcam — lean left, lean right, dodge the falling blocks. No peripherals. No install. Just a camera and a browser.

Built as a creative application of pose estimation, it demonstrates how raw ML keypoint data can be transformed into a playable, feel-good game experience with careful smoothing and collision math.

> **Try it now →** [srajan2006.github.io/Nose-Dodge-Game](https://srajan2006.github.io/Nose-Dodge-Game/)

---

## Demo

| Gameplay | Game Over |
|----------|-----------|
| Player tracks nose position in real time, dodging orange obstacles that fall at increasing speed | Score is saved, press `R` to restart with fresh difficulty ramp |


---

## How it works

```
Webcam feed
    │
    ▼
ml5 PoseNet  ──→  nose.x  (raw, ~12 fps, jittery)
    │
    ▼
lerp smoothing   ──→  smoothNoseX  (60 fps, fluid)
    │
    ▼
constrain()      ──→  playerX  (clamped to canvas bounds)
    │
    ▼
circle-rect collision  ──→  game over / score++
```

### The smoothing trick

PoseNet fires at ~12 fps but the canvas redraws at 60 fps. Without interpolation, the player snaps between positions every few frames. The fix is a single lerp per frame:

```js
smoothNoseX = lerp(smoothNoseX, rawNoseX, 0.15);
```

`0.15` means "move 15% of the remaining distance each frame." The result is a player that feels physically connected to your body — responsive but never jittery.

### Collision detection

Uses **circle-vs-AABB** (axis-aligned bounding box) rather than two bounding boxes, so near-misses feel fair:

```js
function circleRectCollide(cx, cy, cr, rx, ry, rw, rh) {
  let nearX = constrain(cx, rx - rw / 2, rx + rw / 2);
  let nearY = constrain(cy, ry - rh / 2, ry + rh / 2);
  let dx = cx - nearX;
  let dy = cy - nearY;
  return (dx * dx + dy * dy) < (cr * cr);
}
```

### Difficulty ramp

Two independent escalation curves keep the game tense without becoming unfair:

```js
// Fall speed increases every 300 frames
speed = 3 + floor(frameCount_ / 300) * 0.8;

// Spawn rate increases every 500 frames (capped at minimum gap of 35 frames)
if (frameCount_ % 500 === 0 && spawnInterval > 35) {
  spawnInterval -= 8;
}
```

---

## Tech stack

| Layer | Technology | Why |
|-------|-----------|-----|
| Rendering | [p5.js 1.9](https://p5js.org/) | Canvas drawing + game loop out of the box |
| Pose estimation | [ml5.js PoseNet](https://ml5js.org/reference/posenet/) | Friendly wrapper around TensorFlow.js PoseNet |
| Hosting | GitHub Pages | Zero-config static deploy |
| Language | Vanilla JS | No build step, runs anywhere |

---

## Getting started

### Run locally

```bash
git clone https://github.com/srajan2006/Nose-Dodge-Game.git
cd Nose-Dodge-Game

# Any static file server works — Python is the quickest
python -m http.server 8000
# → open http://localhost:8000
```

> **Why a server?** Browsers block webcam access on `file://` URLs. A local server serves over `http://` which allows camera permissions.

### Browser requirements

- Chrome or Edge (recommended — best WebGL + camera performance)
- Camera permission must be granted
- Decent lighting on your face improves nose tracking confidence

---

## Project structure

```
Nose-Dodge-Game/
├── index.html       # Entry point — loads p5, ml5, sketch
├── sketch.js        # All game logic (setup, draw, PoseNet callbacks)
└── README.md
```

---

## Controls

| Action | How |
|--------|-----|
| Move player | Lean your body left / right |
| Clear canvas | Spread hands far apart (> 300px wrist distance) |
| Restart | Press `R` after game over |

---

## Key implementation notes

**`flipHorizontal: true` in poseNet config** — without this, moving right moves the player left. Always mirror the video when using PoseNet for intuitive controls.

**Own frame counter (`frameCount_`)** — p5's built-in `frameCount` never resets. Using a local variable ensures difficulty always starts from zero on restart, not from wherever the last game ended.

**Backwards loop when splicing** — obstacles are removed via `splice()` inside a loop. Iterating from `length - 1` to `0` prevents index-shift bugs that cause every other obstacle to be skipped.

---

## Possible extensions

- [ ] High score saved to `localStorage`
- [ ] Sound effects using `p5.sound` (wrist-to-pitch theremin on idle screen)
- [ ] Power-ups — shrink player size, slow time
- [ ] Multiplayer — second player tracked via left/right screen half
- [ ] Mobile support via `DeviceMotionEvent` as fallback when no camera

---

## License

MIT — do whatever you want with it. A star ⭐ is appreciated if this helped you.

---

<div align="center">

Built with p5.js · ml5.js · a webcam · and a nose

</div>
