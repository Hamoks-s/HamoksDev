// ================= SCREENS + INK TRANSITION =================
var ink = document.getElementById('ink');
var busy = false;

function showScreen(id) {
  var screens = document.querySelectorAll('.screen');
  for (var i = 0; i < screens.length; i++) {
    screens[i].classList.remove('active');
  }
  document.getElementById(id).classList.add('active');

  if (id === 'game') { startGame(); } else { running = false; }
  if (id === 'gift') { resetGift(); }
  if (id === 'quiz') { startQuiz(); }
  if (id === 'rhythm') { prepareRhythm(); }
  if (id === 'geo') { startGeo(); }
  if (id === 'rose') { startRose(); }
}

// x and y = where the dark circle starts growing (where she tapped)
function goTo(id, x, y) {
  if (busy) return;
  busy = true;
  x = x || window.innerWidth / 2;
  y = y || window.innerHeight / 2;

  ink.style.transition = 'none';
  ink.style.clipPath = 'circle(0px at ' + x + 'px ' + y + 'px)';
  ink.style.opacity = '1';
  void ink.offsetWidth; // forces the browser to apply the styles above before animating
  ink.style.transition = 'clip-path 0.6s ease-in';
  ink.style.clipPath = 'circle(150vmax at ' + x + 'px ' + y + 'px)';

  setTimeout(function () {
    showScreen(id);
    ink.style.transition = 'opacity 0.5s';
    ink.style.opacity = '0';
    busy = false;
  }, 650);
}

// ================= MUSIC PLAYER =================
// ===== EDIT HERE: background music player (plays on the whole page) =====
// title = name shown in the player
// src   = mp3 file in the "audio" folder
// cover = album picture in the "img" folder (square works best)
// Add or remove whole lines to change the playlist. Keep the comma after every line except the last.
var SONGS = [
  { title: 'R U Mine?', src: 'audio/r-u-mine.mp3', cover: 'img/album1.jpg' },
  { title: 'Song 2', src: 'audio/song2.mp3', cover: 'img/album2.jpg' }
];

var audio = new Audio();
var songIndex = 0;
var musicWrap = document.getElementById('music');
var songTitle = document.getElementById('songTitle');
var albumArt = document.getElementById('albumArt');
var playPauseBtn = document.getElementById('playPause');

function loadSong(index) {
  songIndex = (index + SONGS.length) % SONGS.length;
  audio.src = SONGS[songIndex].src;
  songTitle.textContent = SONGS[songIndex].title;
  albumArt.style.backgroundImage = 'url(' + SONGS[songIndex].cover + ')';
}

function playMusic() {
  // play() returns a promise, it fails if the file is missing, so we ignore errors
  audio.play().catch(function () {});
}

// Used later by the rhythm game: lockMusic(true) before it, lockMusic(false) after it
function lockMusic(isLocked) {
  if (isLocked) {
    audio.pause();
    musicWrap.style.display = 'none';
  } else {
    musicWrap.style.display = 'flex';
    playMusic();
  }
}

document.getElementById('musicToggle').addEventListener('click', function () {
  document.getElementById('musicPanel').classList.toggle('open');
});
playPauseBtn.addEventListener('click', function () {
  if (audio.paused) { playMusic(); } else { audio.pause(); }
});
document.getElementById('stopBtn').addEventListener('click', function () {
  audio.pause();
  audio.currentTime = 0;
});
document.getElementById('back10').addEventListener('click', function () {
  audio.currentTime = Math.max(0, audio.currentTime - 10);
});
document.getElementById('fwd10').addEventListener('click', function () {
  audio.currentTime = audio.currentTime + 10;
});
document.getElementById('nextBtn').addEventListener('click', function () {
  loadSong(songIndex + 1);
  playMusic();
});
audio.addEventListener('ended', function () { loadSong(songIndex + 1); playMusic(); });
audio.addEventListener('play', function () { playPauseBtn.textContent = '❚❚'; });
audio.addEventListener('pause', function () { playPauseBtn.textContent = '▶'; });

// ================= START BUTTON =================
document.getElementById('startBtn').addEventListener('click', function (e) {
  musicWrap.style.display = 'flex';
  loadSong(0);
  playMusic(); // allowed here because it is triggered by her tap
  goTo('game', e.clientX, e.clientY);
});

// ================= FISHING GAME =================
var W = 180;            // game size in "big pixels", CSS scales it up
var H = 170;
var WATER_TOP = 30;
var SEABED = 166;
var ROD_TOP = WATER_TOP - 9;

var canvas = document.getElementById('lake');
canvas.width = W;
canvas.height = H;
var ctx = canvas.getContext('2d');

// --- tweak the difficulty here ---
var HOOK_DOWN_SPEED = 48;   // bigger = hook falls faster
var HOOK_UP_SPEED = 80;
var OCTOPUS_SPEED = 10;
var BANDS = [               // each depth level: y position and number of fish
  { y: 46, count: 3 },
  { y: 70, count: 3 },
  { y: 94, count: 3 },
  { y: 118, count: 2 }
];
// ---------------------------------

var FISH_SPRITE = [
  '....oooooo..',
  'o..oooooooo.',
  'ooooooooeooo',
  'o..oooooooo.',
  '....oooooo..'
];
var OCTOPUS_SPRITE = [
  '....oooooo....',
  '..oooooooooo..',
  '.oooooooooooo.',
  '.oooeooooeooo.',
  '.oooooooooooo.',
  '..oooooooooo..',
  '.o.oo.oo.oo.o.',
  'o..o..oo..o..o',
  '.o.o..o..o..o.'
];
var FISH_COLORS = ['#ff8fb8', '#9fb0d0', '#ffb68a', '#b7a6e6'];
var EYE_COLOR = '#0b1426';

var bg = document.createElement('canvas');   // background is drawn once
bg.width = W;
bg.height = H;

var fishList = [];
var octopuses = [];
var rodX = W / 2;
var hookY = ROD_TOP + 14;
var hookState = 'idle';   // 'idle', 'down' or 'up'
var caughtFish = null;
var caughtCount = 0;
var running = false;
var lastTime = 0;

function mixColor(c1, c2, t) {
  var r = Math.round(c1[0] + (c2[0] - c1[0]) * t);
  var g = Math.round(c1[1] + (c2[1] - c1[1]) * t);
  var b = Math.round(c1[2] + (c2[2] - c1[2]) * t);
  return 'rgb(' + r + ',' + g + ',' + b + ')';
}

function buildBackground() {
  var b = bg.getContext('2d');
  var y, x;

  // sky: dark blue at the top, pink glow at the horizon
  for (y = 0; y < WATER_TOP; y += 3) {
    b.fillStyle = mixColor([22, 30, 64], [150, 82, 126], y / WATER_TOP);
    b.fillRect(0, y, W, 3);
  }
  // stars
  var stars = [[8, 5], [22, 12], [40, 4], [58, 10], [75, 6], [112, 18], [30, 20], [130, 7], [168, 16], [95, 3]];
  b.fillStyle = '#e8ebf2';
  for (var s = 0; s < stars.length; s++) {
    b.fillRect(stars[s][0], stars[s][1], 1, 1);
  }
  // moon
  b.fillStyle = '#f3e9d2';
  for (var dy = -4; dy <= 4; dy++) {
    for (var dx = -4; dx <= 4; dx++) {
      if (dx * dx + dy * dy <= 16) b.fillRect(150 + dx, 10 + dy, 1, 1);
    }
  }
  // hills
  b.fillStyle = '#10172b';
  for (x = 0; x < W; x++) {
    var h = 6 + Math.round(3 * Math.sin(x / 10) + 2 * Math.sin(x / 4));
    b.fillRect(x, WATER_TOP - h, 1, h);
  }
  // water: gets darker every 10 rows
  for (y = WATER_TOP; y < H; y += 10) {
    var t = (y - WATER_TOP) / (H - WATER_TOP);
    b.fillStyle = mixColor([56, 98, 148], [8, 14, 34], t);
    b.fillRect(0, y, W, 10);
  }
  b.fillStyle = '#9fb8de';          // light line on the water surface
  b.fillRect(0, WATER_TOP, W, 1);
  // seabed
  b.fillStyle = '#151c30';
  b.fillRect(0, SEABED, W, H - SEABED);
  b.fillStyle = '#222b45';
  var pebbles = [10, 31, 55, 78, 99, 121, 146, 170];
  for (var p = 0; p < pebbles.length; p++) {
    b.fillRect(pebbles[p], SEABED, 4, 2);
  }
}

function drawSprite(sprite, x, y, bodyColor, flip) {
  for (var row = 0; row < sprite.length; row++) {
    for (var col = 0; col < sprite[row].length; col++) {
      var c = sprite[row][col];
      if (c === '.') continue;
      var drawCol = flip ? sprite[row].length - 1 - col : col;
      ctx.fillStyle = (c === 'e') ? EYE_COLOR : bodyColor;
      ctx.fillRect(Math.round(x) + drawCol, Math.round(y) + row, 1, 1);
    }
  }
}

function overlaps(ax, ay, aw, ah, bx, by, bw, bh) {
  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
}

function touchesOctopus() {
  for (var i = 0; i < octopuses.length; i++) {
    var o = octopuses[i];
    if (overlaps(rodX - 1, hookY, 3, 3, o.x, o.y, 14, 9)) return true;
  }
  return false;
}

function startGame() {
  fishList = [];
  var colorIndex = 0;
  for (var i = 0; i < BANDS.length; i++) {
    for (var j = 0; j < BANDS[i].count; j++) {
      fishList.push({
        x: (j * W) / BANDS[i].count + Math.random() * 20,
        y: BANDS[i].y,
        speed: 14 + Math.random() * 16,
        color: FISH_COLORS[colorIndex % FISH_COLORS.length],
        alive: true,
        respawnIn: 0,
        dir: (Math.random() < 0.5) ? 1 : -1
      });
      colorIndex++;
    }
  }
  octopuses = [
    { x: 30, y: 154, dir: 1, speed: OCTOPUS_SPEED, color: '#ff6fa5' },
    { x: 130, y: 154, dir: -1, speed: OCTOPUS_SPEED * 1.4, color: '#ff9ec4' }
  ];
  rodX = W / 2;
  hookY = ROD_TOP + 14;
  hookState = 'idle';
  caughtFish = null;
  caughtCount = 0;
  document.getElementById('caughtText').textContent = 'Fish caught: 0';

  running = true;
  lastTime = performance.now();
  requestAnimationFrame(loop);
}

function loop(now) {
  if (!running) return;
  var dt = Math.min((now - lastTime) / 1000, 0.05);
  lastTime = now;
  update(dt);
  draw();
  requestAnimationFrame(loop);
}

function update(dt) {
  var i, f;

  // fish and octopuses swim back and forth, turning around at the walls
  for (i = 0; i < fishList.length; i++) {
    f = fishList[i];
    if (!f.alive) {
      f.respawnIn -= dt;
      if (f.respawnIn <= 0) { f.alive = true; f.x = 0; f.dir = 1; }
      continue;
    }
    f.x += f.speed * f.dir * dt;
    if (f.x < 0) { f.x = 0; f.dir = 1; }
    if (f.x > W - 12) { f.x = W - 12; f.dir = -1; }
    
  }
  for (i = 0; i < octopuses.length; i++) {
    var o = octopuses[i];
    o.x += o.speed * o.dir * dt;
    if (o.x < 0) { o.x = 0; o.dir = 1; }
    if (o.x > W - 14) { o.x = W - 14; o.dir = -1; }
  }
  

  if (hookState === 'down') {
    hookY += HOOK_DOWN_SPEED * dt;

    // hit the octopus = win
    if (touchesOctopus()) {
      running = false;
      var r = canvas.getBoundingClientRect();
      goTo('reveal', r.left + r.width / 2, r.top + r.height / 2);
      return;
    }
    // hit a fish = catch it and pull the hook up
    for (i = 0; i < fishList.length; i++) {
      f = fishList[i];
      if (f.alive && overlaps(rodX - 1, hookY, 3, 3, f.x, f.y, 12, 5)) {
        f.alive = false;
        f.respawnIn = 2.5;
        caughtFish = f;
        hookState = 'up';
        break;
      }
    }
    if (hookY >= SEABED - 3) hookState = 'up';   // missed everything
  } else if (hookState === 'up') {
    hookY -= HOOK_UP_SPEED * dt;
    if (hookY <= ROD_TOP + 14) {
      hookY = ROD_TOP + 14;
      hookState = 'idle';
      if (caughtFish) {
        caughtCount++;
        document.getElementById('caughtText').textContent = 'Fish caught: ' + caughtCount;
        caughtFish = null;
      }
    }
  }
}

function draw() {
  var i, f;
  ctx.drawImage(bg, 0, 0);

  for (i = 0; i < octopuses.length; i++) {
    var o = octopuses[i];
    drawSprite(OCTOPUS_SPRITE, o.x, o.y, o.color, o.dir === -1);
  }
  for (i = 0; i < fishList.length; i++) {
    f = fishList[i];
    if (f.alive) drawSprite(FISH_SPRITE, f.x, f.y, f.color, f.dir === -1);
  }

  var x = Math.round(rodX);
  // boat
  ctx.fillStyle = '#8b94a5';
  ctx.fillRect(x - 7, WATER_TOP - 2, 14, 2);
  ctx.fillStyle = '#6a7387';
  ctx.fillRect(x - 5, WATER_TOP, 10, 1);
  // line, hook and little pink flag
  ctx.fillStyle = '#cfd6e4';
  ctx.fillRect(x, ROD_TOP, 1, Math.round(hookY) - ROD_TOP);
  ctx.fillStyle = '#ff8fb8';
  ctx.fillRect(x + 1, ROD_TOP, 2, 2);
  ctx.fillRect(x - 1, Math.round(hookY), 3, 3);

  // fish hanging on the hook
  if (caughtFish) drawSprite(FISH_SPRITE, x - 6, hookY, caughtFish.color, caughtFish.dir === -1);
}

function setRod(e) {
  if (hookState !== 'idle') return;   // rod is locked while the hook is in the water
  var rect = canvas.getBoundingClientRect();
  var x = ((e.clientX - rect.left) / rect.width) * W;
  rodX = Math.max(6, Math.min(W - 6, x));
}
var pressStartX = 0;
var pressStartY = 0;
var pressed = false;
var dragged = false;

function dropHook() {
  if (hookState === 'idle') hookState = 'down';
}

canvas.addEventListener('pointerdown', function (e) {
  pressed = true;
  dragged = false;
  pressStartX = e.clientX;
  pressStartY = e.clientY;
  setRod(e);
});
canvas.addEventListener('pointermove', function (e) {
  setRod(e);
  var moveX = Math.abs(e.clientX - pressStartX);
  var moveY = Math.abs(e.clientY - pressStartY);
  if (pressed && (moveX > 8 || moveY > 8)) dragged = true;
});
canvas.addEventListener('pointerup', function () {
  pressed = false;
  if (!dragged) dropHook();   // a tap or click without dragging drops the hook
});
canvas.addEventListener('pointercancel', function () {
  pressed = false;
});

document.getElementById('dropBtn').addEventListener('click', dropHook);

buildBackground();

// ================= REVEAL + GIFT =================
document.getElementById('revealBtn').addEventListener('click', function (e) {
  goTo('gift', e.clientX, e.clientY);
});

var giftEl = document.getElementById('giftBox');
var giftHint = document.getElementById('giftHint');
var giftText = document.getElementById('giftText');
var giftTaps = 0;
var GIFT_HINTS = ['Tap the gift', '2 more taps…', 'One more tap…'];
var CONFETTI_COLORS = ['#ff8fb8', '#e8ebf2', '#8b94a5', '#b3203a', '#ffd166'];

function makeConfettiPiece(color) {
  var piece = document.createElement('div');
  piece.className = 'confetti';
  piece.style.background = color;
  giftEl.appendChild(piece);

  var dx = (Math.random() - 0.5) * 320;
  var up = 80 + Math.random() * 140;
  var fall = 120 + Math.random() * 120;
  var spin = Math.random() * 720 - 360;
  var anim = piece.animate([
    { transform: 'translate(0px, 0px) rotate(0deg)', opacity: 1 },
    { transform: 'translate(' + dx * 0.6 + 'px, ' + (-up) + 'px) rotate(' + spin / 2 + 'deg)', opacity: 1, offset: 0.4 },
    { transform: 'translate(' + dx + 'px, ' + fall + 'px) rotate(' + spin + 'deg)', opacity: 0 }
  ], { duration: 1500 + Math.random() * 700, easing: 'ease-out' });
  anim.onfinish = function () { piece.remove(); };
}

function launchConfetti() {
  for (var i = 0; i < 50; i++) {
    makeConfettiPiece(CONFETTI_COLORS[i % CONFETTI_COLORS.length]);
  }
}

function resetGift() {
  giftTaps = 0;
  giftEl.className = 'gift';
  giftText.classList.remove('show');
  giftHint.textContent = GIFT_HINTS[0];
}

giftEl.addEventListener('click', function () {
  if (giftTaps >= 3) return;
  giftTaps++;

  giftEl.classList.remove('shake');
  void giftEl.offsetWidth;
  giftEl.classList.add('shake');

  giftEl.classList.remove('tap1', 'tap2');
  if (giftTaps < 3) {
    giftEl.classList.add('tap' + giftTaps);     // lid opens a bit more with each tap
    giftHint.textContent = GIFT_HINTS[giftTaps];
    return;
  }
  giftHint.textContent = '';
  setTimeout(function () {
    launchConfetti();
    giftEl.classList.add('open');               // lid flies off, can comes out
    setTimeout(function () {
      giftEl.classList.add('done');             // box fades, can moves to the middle
      giftText.classList.add('show');
    }, 1400);
  }, 350);
});

document.getElementById('giftBtn').addEventListener('click', function (e) {
  goTo('quiz', e.clientX, e.clientY);
});

// ================= RICK AND MORTY QUIZ =================
// ===== EDIT HERE: Rick and Morty quiz =====
// q = the question, options = the answers, answer = position of the right one (first = 0, second = 1, ...)
// Pictures: img/quiz1.jpg, img/quiz2.jpg ... in question order (gifs work too).
// For another file name add  image: 'img/name.gif'  to that question.
// You can add or remove questions. Then also change QUIZ_RESULTS below: it needs one entry for every possible score (0 up to the number of questions).
var QUIZ = [
  { q: 'What does Rick turn himself into to get out of family therapy?',
    options: ['A cat', 'A pickle', 'A toaster', 'A tiny car'], answer: 1 },
  { q: 'What is the butter robot\'s purpose?',
    options: ['To pass the butter', 'To cook breakfast', 'To guard the fridge', 'To tell jokes'], answer: 0 },
  { q: 'What are the blue helpers called that appear from a box to finish one task?',
    options: ['Gromflomites', 'Plumbuses', 'Mr. Meeseeks', 'Cromulons'], answer: 2 },
  { q: 'Which dimension is the main Rick from?',
    options: ['R-777', 'B-204', 'Z-42', 'C-137'], answer: 3 },
  { q: 'What does "Wubba lubba dub dub" actually mean?',
    options: ['Let\'s go on an adventure', 'I am in great pain, please help me', 'Time to eat', 'Goodbye, Morty'], answer: 1 },
  { q: 'Why does Rick get so angry when someone uses his toilet?',
    options: ["Because it's his private place where he can be completely alone.", 'Because the toilet had a built-in coffee machine that stopped working.',
       'Because someone used his emergency toilet snacks.', 'Because someone changed the toilet seat.'], answer: 0 }
];

// Result for each score, from 0 to 6 correct answers (index = score)
var QUIZ_RESULTS = [
  { grade: 'F',  text: 'Zero. Even Jerry would have gotten one.' },
  { grade: 'D-', text: 'One right. Maybe the show watched you instead.' },
  { grade: 'D',  text: 'Two right. A rewatch is calling.' },
  { grade: 'C',  text: 'Half and half. Not bad, not Rick-level.' },
  { grade: 'B',  text: 'Solid. You know your dimensions.' },
  { grade: 'A',  text: 'Almost perfect. One slip, very Morty of you.' },
  { grade: 'A+', text: 'Perfect score. Rick would pretend not to be impressed.' }
];

var quizCount = document.getElementById('quizCount');
var quizQuestion = document.getElementById('quizQuestion');
var quizAnswers = document.getElementById('quizAnswers');
var quizBody = document.getElementById('quizBody');
var quizImg = document.querySelector('#quizImg img');
var quizIndex = 0;
var quizScore = 0;
var quizLocked = false;

function startQuiz() {
  quizIndex = 0;
  quizScore = 0;
  showQuestion();
}

function showQuestion() {
  var item = QUIZ[quizIndex];
  quizLocked = false;
  quizCount.textContent = 'Question ' + (quizIndex + 1) + ' of ' + QUIZ.length;
  // image per question: img/quiz1.jpg, img/quiz2.jpg ... (or add  image: 'img/x.gif'  to a question)
  var imgPath = item.image || 'images/quiz' + (quizIndex + 1) + '.jpg';
  quizImg.src = imgPath;
  quizQuestion.textContent = item.q;
  quizAnswers.innerHTML = '';
  for (var i = 0; i < item.options.length; i++) {
    quizAnswers.appendChild(makeAnswerButton(item.options[i], i));
  }
}

function swapQuestion() {
  quizBody.classList.add('out');             // slide the old question out
  setTimeout(function () {
    showQuestion();                          // swap the content while it is invisible
    quizBody.style.transition = 'none';
    quizBody.classList.remove('out');
    quizBody.classList.add('in');            // jump to the right side, instantly
    void quizBody.offsetWidth;               // make the browser apply that first
    quizBody.style.transition = '';
    quizBody.classList.remove('in');         // slide into the middle
  }, 300);
}

// a separate function so every button remembers its own number i
function makeAnswerButton(label, i) {
  var btn = document.createElement('button');
  btn.textContent = label;
  btn.addEventListener('click', function (e) { pickAnswer(i, e); });
  return btn;
}

function pickAnswer(i, e) {
  if (quizLocked) return;
  quizLocked = true;
  var rightIndex = QUIZ[quizIndex].answer;
  quizAnswers.children[rightIndex].classList.add('right');
  if (i === rightIndex) {
    quizScore++;
  } else {
    quizAnswers.children[i].classList.add('wrong');
  }
  var x = e.clientX;
  var y = e.clientY;
  setTimeout(function () {
    quizIndex++;
    if (quizIndex < QUIZ.length) {
      swapQuestion();
    } else {
      var result = QUIZ_RESULTS[quizScore];
      document.getElementById('quizGrade').textContent = result.grade;
      document.getElementById('quizScoreText').textContent = quizScore + ' / ' + QUIZ.length + ' correct';
      document.getElementById('quizComment').textContent = result.text;
      goTo('quizResult', x, y);
    }
  }, 1000);
}

document.getElementById('quizResultBtn').addEventListener('click', function (e) {
  goTo('rhythmSelect', e.clientX, e.clientY);
});

// ================= RHYTHM GAME =================
// ===== EDIT HERE: rhythm game notes =====
// These are TEST notes. Make real ones with recorder.html (open it in your browser), then paste its output
// into the notes list of the song in RHYTHM_SONGS below.
// time = seconds from the start of the clip, lane = 0 (left), 1 (middle) or 2 (right).
// The first note must be at 1.6 s or later, because notes need 1.6 s to fall.
var NOTES = [
  { time: 2.0, lane: 1 }, { time: 2.6, lane: 1 }, { time: 3.2, lane: 0 }, { time: 3.8, lane: 2 },
  { time: 4.4, lane: 1 }, { time: 5.0, lane: 0 }, { time: 5.3, lane: 0 }, { time: 5.9, lane: 2 },
  { time: 6.5, lane: 1 }, { time: 7.1, lane: 0 }, { time: 7.7, lane: 2 }, { time: 8.0, lane: 2 },
  { time: 8.6, lane: 1 }, { time: 9.2, lane: 0 }, { time: 9.8, lane: 1 }, { time: 10.4, lane: 2 },
  { time: 11.0, lane: 0 }, { time: 11.3, lane: 1 }, { time: 11.6, lane: 2 }, { time: 12.2, lane: 1 },
  { time: 12.8, lane: 0 }, { time: 13.4, lane: 2 }, { time: 14.0, lane: 1 }, { time: 14.6, lane: 0 },
  { time: 15.2, lane: 2 }, { time: 15.5, lane: 1 }, { time: 15.8, lane: 0 }, { time: 16.6, lane: 1 }
];
// TEST notes for songs 2 and 3 (a steady pattern). The recorder tool will replace them later.
function makeTestNotes(step, count) {
  var lanes = [1, 0, 2, 1, 2, 0];
  var list = [];
  for (var i = 0; i < count; i++) { list.push({ time: 2.0 + i * step, lane: lanes[i % lanes.length] }); }
  return list;
}

// ===== EDIT HERE: songs she can choose from in the rhythm game =====
// title = button text, src = clip in the "audio" folder (cut the part you want, 20-40 s is enough),
// notes = the list from recorder.html (replace NOTES / makeTestNotes(...) with the pasted list: notes: [ ... ]).
var RHYTHM_SONGS = [
  { title: 'Song 1', src: 'audio/rhythm1.mp3', notes: NOTES },
  { title: 'Song 2', src: 'audio/rhythm2.mp3', notes: makeTestNotes(0.45, 36) },
  { title: 'Song 3', src: 'audio/rhythm3.mp3', notes: makeTestNotes(0.75, 22) }
];

// build the song buttons on the selection screen
function makeSongButton(song) {
  var btn = document.createElement('button');
  btn.textContent = song.title;
  btn.addEventListener('click', function (e) {
    currentSong = song;
    goTo('rhythm', e.clientX, e.clientY);
  });
  return btn;
}
for (var si = 0; si < RHYTHM_SONGS.length; si++) {
  document.getElementById('songList').appendChild(makeSongButton(RHYTHM_SONGS[si]));
}

// --- tweak the feel here ---
var FALL_TIME = 1.6;        // seconds a note needs to fall to the line
var HIT_WINDOW = 0.18;      // seconds early/late that still counts (forgiving for bluetooth)
var PERFECT_WINDOW = 0.08;  // seconds early/late for "Perfect"
// ---------------------------

// Result for each accuracy level. The first one with minPercent <= your percent is used.
var RHYTHM_RESULTS = [
  { minPercent: 90, grade: 'S', text: 'Flawless. Did you secretly practice?' },
  { minPercent: 75, grade: 'A', text: 'Great timing. Piano lessons paid off.' },
  { minPercent: 55, grade: 'B', text: 'Nice! You have a good sense of rhythm.' },
  { minPercent: 30, grade: 'C', text: 'Not bad. The beat was just playing hard to get.' },
  { minPercent: 0,  grade: 'D', text: 'It\'s fine, nobody can see you. Maybe it was the phone.' }
];

var RW = 360, RH = 480, HIT_Y = 400, LANE_W = 120, NOTE_R = 34;
var LANE_COLORS = ['#ff8fb8', '#9fb0d0', '#b7a6e6'];

var rCanvas = document.getElementById('rhythmCanvas');
var rctx = rCanvas.getContext('2d');
var rAudio = new Audio();
var currentSong = RHYTHM_SONGS[0];
var rState = 'idle';        // 'idle', 'wait' (audio loading), 'audio' or 'timer' (no audio file)
var rStartTime = 0;
var rRunning = false;
var rNotes = [];
var rStats = { perfect: 0, good: 0, miss: 0 };
var rFlash = [0, 0, 0];     // when each lane was last tapped
var rFeedback = '';
var rFeedbackTime = 0;

function prepareRhythm() {
  lockMusic(true);                       // background music off during this game
  rRunning = false;
  rState = 'idle';
  rAudio.src = currentSong.src;
  rNotes = currentSong.notes.map(function (n) { return { time: n.time, lane: n.lane, state: 0 }; });
  document.getElementById('rhythmStart').style.display = '';
  drawRhythm(0);
}

document.getElementById('rhythmStart').addEventListener('click', function () {
  this.style.display = 'none';
  rStats = { perfect: 0, good: 0, miss: 0 };
  rFeedback = '';
  rState = 'wait';
  rStartTime = performance.now();
  rAudio.currentTime = 0;
  // if the audio file exists we use the song as the clock, if not we use a plain timer
  rAudio.play().then(function () {
    rState = 'audio';
  }).catch(function () {
    rState = 'timer';
    rStartTime = performance.now();
  });
  rRunning = true;
  requestAnimationFrame(rhythmLoop);
});

function songTime() {
  if (rState === 'audio') return rAudio.currentTime;
  if (rState === 'timer') return (performance.now() - rStartTime) / 1000;
  return 0;
}

function showFeedback(text) {
  rFeedback = text;
  rFeedbackTime = performance.now();
}

rCanvas.addEventListener('pointerdown', function (e) {
  if (!rRunning || rState === 'wait') return;
  var rect = rCanvas.getBoundingClientRect();
  var lane = Math.floor((e.clientX - rect.left) / rect.width * 3);
  lane = Math.max(0, Math.min(2, lane));
  rFlash[lane] = performance.now();

  var t = songTime();
  var best = null;
  var bestDiff = HIT_WINDOW;
  for (var i = 0; i < rNotes.length; i++) {
    var n = rNotes[i];
    var diff = Math.abs(n.time - t);
    if (n.state === 0 && n.lane === lane && diff <= bestDiff) {
      best = n;
      bestDiff = diff;
    }
  }
  if (best) {
    best.state = 1;
    if (bestDiff <= PERFECT_WINDOW) { rStats.perfect++; showFeedback('Perfect!'); }
    else { rStats.good++; showFeedback('Good'); }
  }
  // tapping with no note nearby does nothing, there is no penalty
});

function rhythmLoop() {
  if (!rRunning) return;
  var t = songTime();
  for (var i = 0; i < rNotes.length; i++) {
    if (rNotes[i].state === 0 && t - rNotes[i].time > HIT_WINDOW) {
      rNotes[i].state = 2;               // too late: missed
      rStats.miss++;
      showFeedback('Miss');
    }
  }
  drawRhythm(t);
  var lastNote = rNotes[rNotes.length - 1].time;
  if (t > lastNote + 1.5) {
    finishRhythm();
  } else {
    requestAnimationFrame(rhythmLoop);
  }
}

function drawRhythm(t) {
  var now = performance.now();
  rctx.fillStyle = '#0e1a33';
  rctx.fillRect(0, 0, RW, RH);
  for (var lane = 0; lane < 3; lane++) {
    if (lane % 2 === 1) {
      rctx.fillStyle = 'rgba(255,255,255,0.04)';
      rctx.fillRect(lane * LANE_W, 0, LANE_W, RH);
    }
  }
  // hit line and pads
  rctx.fillStyle = 'rgba(255,143,184,0.5)';
  rctx.fillRect(0, HIT_Y - 2, RW, 4);
  for (var l = 0; l < 3; l++) {
    var cx = l * LANE_W + LANE_W / 2;
    rctx.beginPath();
    rctx.arc(cx, HIT_Y, NOTE_R, 0, Math.PI * 2);
    if (now - rFlash[l] < 120) {
      rctx.fillStyle = 'rgba(255,255,255,0.35)';
      rctx.fill();
    }
    rctx.lineWidth = 4;
    rctx.strokeStyle = LANE_COLORS[l];
    rctx.stroke();
  }
  // notes
  var speed = (HIT_Y + NOTE_R) / FALL_TIME;   // pixels per second
  for (var i = 0; i < rNotes.length; i++) {
    var n = rNotes[i];
    if (n.state === 1) continue;
    var y = HIT_Y - (n.time - t) * speed;
    if (y < -NOTE_R || y > RH + NOTE_R) continue;
    rctx.beginPath();
    rctx.arc(n.lane * LANE_W + LANE_W / 2, y, NOTE_R - 4, 0, Math.PI * 2);
    rctx.fillStyle = LANE_COLORS[n.lane];
    rctx.globalAlpha = n.state === 2 ? 0.25 : 1;
    rctx.fill();
    rctx.globalAlpha = 1;
  }
  // feedback text
  if (now - rFeedbackTime < 500) {
    rctx.font = 'bold 32px sans-serif';
    rctx.textAlign = 'center';
    rctx.fillStyle = '#e8ebf2';
    rctx.fillText(rFeedback, RW / 2, 200);
  }
}

function finishRhythm() {
  rRunning = false;
  rAudio.pause();
  lockMusic(false);                      // background music comes back
  var total = rNotes.length;
  var hits = rStats.perfect + rStats.good;
  var percent = Math.round(hits / total * 100);
  var result = RHYTHM_RESULTS[RHYTHM_RESULTS.length - 1];
  for (var i = 0; i < RHYTHM_RESULTS.length; i++) {
    if (percent >= RHYTHM_RESULTS[i].minPercent) { result = RHYTHM_RESULTS[i]; break; }
  }
  document.getElementById('rhythmGrade').textContent = result.grade;
  document.getElementById('rhythmPercent').textContent = percent + '% of notes hit';
  document.getElementById('rhythmDetails').textContent =
    'Perfect: ' + rStats.perfect + '  |  Good: ' + rStats.good + '  |  Missed: ' + (total - hits);
  document.getElementById('rhythmComment').textContent = result.text;
  goTo('rhythmResult');
}

document.getElementById('rhythmAgainBtn').addEventListener('click', function (e) {
  goTo('rhythmSelect', e.clientX, e.clientY);
});
document.getElementById('rhythmResultBtn').addEventListener('click', function (e) {
  goTo('geoIntro', e.clientX, e.clientY);
});
document.getElementById('geoStartBtn').addEventListener('click', function (e) {
  goTo('geo', e.clientX, e.clientY);
});

// ================= SZCZYTNO GAME =================
// ===== EDIT HERE: Szczytno photos and their real coordinates =====
// image = photo in the "img" folder, lat/lng = where it was taken.
// In Google Maps right-click the exact spot, the first line of the menu is the coordinates (lat, lng), click it to copy.
// The numbers below are PLACEHOLDERS. Keep at least 3 spots (one attempt = 3 rounds); 15 is the plan.
var SPOTS = [
  { image: 'images/geo1.png',  lat: 53.565518, lng: 20.991738 },
  { image: 'images/geo2.png',  lat: 53.567755, lng: 20.991880 },
  { image: 'images/geo3.png',  lat: 53.560601, lng: 20.997845 },
  { image: 'images/geo4.png',  lat: 53.561220, lng: 21.013238 },
  { image: 'images/geo5.png',  lat: 53.566241, lng: 21.000408 },
  { image: 'images/geo6.png',  lat: 53.564163, lng: 21.003337 },
  { image: 'images/geo7.png',  lat: 53.563762, lng: 21.008676 },
  { image: 'images/geo8.png',  lat: 53.572442, lng: 20.972187 },
  { image: 'images/geo9.png',  lat: 53.560670, lng: 21.006887 },
  { image: 'images/geo10.png', lat: 53.564212, lng: 21.000767 },
  { image: 'images/geo11.png', lat: 53.572829, lng: 20.994083 },
  { image: 'images/geo12.png', lat: 53.556688, lng: 21.001304 },
  { image: 'images/geo13.png', lat: 53.564271, lng: 20.996212 },
  { image: 'images/geo14.png', lat: 53.559248, lng: 20.984816 },
  { image: 'images/geo15.png', lat: 53.566295, lng: 20.989024 }
];

// --- rules, tweak here ---
var ROUNDS = 3;              // places per attempt
var PASS_DISTANCE = 300;     // meters: a guess this close counts as "close enough"
var ROUNDS_NEEDED = 2;       // how many close guesses she needs to pass the attempt
var SHOW_ANSWER_HINT = false; // true = shows the right spot on the map before she guesses. Only for testing your coordinates, keep it false for her!
// -------------------------
var MAP_CENTER = [53.5625, 20.9917];

var geoMap = null;
var geoGuessMarker = null;
var geoLayers = [];          // answer marker, line and hint, removed every round
var geoGuess = null;
var geoPool = [];            // spots not used yet, so places do not repeat between attempts
var geoPicked = [];
var geoRound = 0;
var geoClose = 0;
var geoFailedOnce = false;
var geoState = 'guessing';   // 'guessing' or 'done'

var geoConfirm = document.getElementById('geoConfirm');
var geoNext = document.getElementById('geoNext');
var geoFeedback = document.getElementById('geoFeedback');

// distance in meters between two GPS points (haversine formula)
function distanceMeters(lat1, lng1, lat2, lng2) {
  var R = 6371000;
  var rad = Math.PI / 180;
  var dLat = (lat2 - lat1) * rad;
  var dLng = (lng2 - lng1) * rad;
  var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return 2 * R * Math.asin(Math.sqrt(a));
}

function formatDistance(m) {
  return m >= 1000 ? (m / 1000).toFixed(1) + ' km' : Math.round(m) + ' m';
}

var geoPanel = document.getElementById('geoPanel');

// open = big map, closed = small map in the corner
function setPanel(open) {
  geoPanel.classList.toggle('open', open);
  if (geoMap) { setTimeout(function () { geoMap.invalidateSize(); }, 30); }
}
document.getElementById('geoTap').addEventListener('click', function () { setPanel(true); });
document.getElementById('geoMini').addEventListener('click', function () { setPanel(false); });

function startGeo() {
  if (typeof L === 'undefined') {
    geoFeedback.textContent = 'The map could not load. It needs internet.';
    geoNext.style.display = '';
    geoNext.textContent = 'Skip';
    geoState = 'nomap';
    geoPanel.classList.add('open');
    return;
  }
  if (!geoMap) {
    geoMap = L.map('geoMap', { minZoom: 12, maxZoom: 18, maxBounds: [[53.50, 20.88], [53.63, 21.12]] });
    geoMap.setView(MAP_CENTER, 14);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18, attribution: '&copy; OpenStreetMap'
    }).addTo(geoMap);
    geoMap.on('click', onMapClick);
  }
  // take ROUNDS random spots from the pool
  geoPicked = [];
  for (var i = 0; i < ROUNDS; i++) {
    if (geoPool.length === 0) { geoPool = SPOTS.slice(); }
    var k = Math.floor(Math.random() * geoPool.length);
    geoPicked.push(geoPool.splice(k, 1)[0]);
  }
  geoRound = 0;
  geoClose = 0;
  loadRound();
  setTimeout(function () { geoMap.invalidateSize(); }, 50);   // map was hidden when created
}

function clearGeoLayers() {
  for (var i = 0; i < geoLayers.length; i++) { geoLayers[i].remove(); }
  geoLayers = [];
  if (geoGuessMarker) { geoGuessMarker.remove(); geoGuessMarker = null; }
}

function loadRound() {
  var spot = geoPicked[geoRound];
  clearGeoLayers();
  geoGuess = null;
  geoState = 'guessing';
  document.getElementById('geoCount').textContent = 'Round ' + (geoRound + 1) + ' of ' + ROUNDS;
  document.getElementById('geoPhoto').style.backgroundImage = 'url(' + spot.image + ')';
  geoFeedback.textContent = 'Tap the map where you think this is.';
  geoConfirm.style.display = '';
  geoConfirm.disabled = true;
  geoNext.style.display = 'none';
  geoMap.setView(MAP_CENTER, 14);
  geoPanel.classList.remove('done');
  setPanel(false);
  if (SHOW_ANSWER_HINT) {
    geoLayers.push(L.circle([spot.lat, spot.lng], { radius: PASS_DISTANCE, color: '#ffd166', weight: 2, dashArray: '4' }).addTo(geoMap));
  }
}

function onMapClick(e) {
  if (geoState !== 'guessing') return;
  geoGuess = e.latlng;
  if (geoGuessMarker) {
    geoGuessMarker.setLatLng(e.latlng);
  } else {
    geoGuessMarker = L.circleMarker(e.latlng, { radius: 9, color: '#fff', weight: 2, fillColor: '#ff8fb8', fillOpacity: 1 }).addTo(geoMap);
  }
  geoConfirm.disabled = false;
}

geoConfirm.addEventListener('click', function () {
  if (!geoGuess || geoState !== 'guessing') return;
  geoState = 'done';
  geoPanel.classList.add('done');
  var spot = geoPicked[geoRound];
  var d = distanceMeters(geoGuess.lat, geoGuess.lng, spot.lat, spot.lng);
  var close = d <= PASS_DISTANCE;
  if (close) { geoClose++; }
  geoFeedback.textContent = (close ? 'Close enough! You were ' : 'Too far. You were ') + formatDistance(d) + ' away.';

  var answer = [spot.lat, spot.lng];
  geoLayers.push(L.circleMarker(answer, { radius: 9, color: '#fff', weight: 2, fillColor: '#5fcf9a', fillOpacity: 1 }).addTo(geoMap));
  geoLayers.push(L.polyline([geoGuess, answer], { color: '#fff', weight: 2, dashArray: '5' }).addTo(geoMap));
  geoMap.fitBounds([geoGuess, answer], { padding: [40, 40], maxZoom: 17 });

  geoConfirm.style.display = 'none';
  geoNext.style.display = '';
  geoNext.textContent = geoRound < ROUNDS - 1 ? 'Next round' : 'See result';
});

geoNext.addEventListener('click', function (e) {
  if (geoState === 'nomap') { goTo('rose', e.clientX, e.clientY); return; }
  geoRound++;
  if (geoRound < ROUNDS) { loadRound(); return; }

  // attempt finished
  var passed = geoClose >= ROUNDS_NEEDED;
  if (!passed) { geoFailedOnce = true; }
  document.getElementById('geoGrade').textContent = geoClose + '/' + ROUNDS;
  document.getElementById('geoTitle').textContent = passed ? 'You know your town!' : 'So close, but not quite';
  document.getElementById('geoText').textContent = passed
    ? 'You were close enough in ' + geoClose + ' of ' + ROUNDS + ' places.'
    : 'You need ' + ROUNDS_NEEDED + ' close guesses out of ' + ROUNDS + '. Try again, the places will be different.';
  document.getElementById('geoContinueBtn').style.display = passed ? '' : 'none';
  document.getElementById('geoAgainBtn').style.display = '';
  document.getElementById('geoAgainBtn').style.background = passed ? 'var(--grey)' : '';
  document.getElementById('geoSkipBtn').style.display = (!passed && geoFailedOnce) ? '' : 'none';   // skip appears after the first failed attempt
  goTo('geoResult', e.clientX, e.clientY);
});

document.getElementById('geoContinueBtn').addEventListener('click', function (e) { goTo('rose', e.clientX, e.clientY); });
document.getElementById('geoSkipBtn').addEventListener('click', function (e) { goTo('rose', e.clientX, e.clientY); });
document.getElementById('geoAgainBtn').addEventListener('click', function (e) { goTo('geo', e.clientX, e.clientY); });

// ================= ROSE COLORING =================
// The picture is made from your photo: 16 x 16 squares, one letter per square (a to g).
// Every square, background included, has to be painted. Colors by letter:
// a = background, b = leaf, c = deepest red, d = dark red, e = red, f = bright red, g = light red highlight
var ROSE = [
  'aaaaaabbaaaaaaaa',
  'aabbdeebbaaaaaaa',
  'agbgfffffffeebba',
  'abbfffffeeffedaa',
  'aacffeeeeeeeffea',
  'accefeedddeeefea',
  'aaedfdcdddeeefda',
  'bgededcdeddeefda',
  'bbdeddddeddfefca',
  'cccfdecddcefefca',
  'baaeedeeefffeeea',
  'aaaaddddddedccbb',
  'aaaaaacccccdbbbb',
  'aaaaaaacccedbaaa',
  'aaaaaaaccaabbaaa',
  'aaaaaaaaaaaaaaaa'
];
var ROSE_COLORS = {
  a: '#0a0c0c',
  b: '#303e2c',
  c: '#46040e',
  d: '#780818',
  e: '#aa1024',
  f: '#d72032',
  g: '#f05f69'
};

var roseGrid = document.getElementById('roseGrid');
var roseHint = document.getElementById('roseHint');
var rosePicked = null;
var roseLeft = 0;            // squares still to paint
var roseLeftByColor = {};
var roseDown = false;        // finger or mouse is down, so dragging paints

function startRose() {
  rosePicked = null;
  roseLeft = 0;
  roseLeftByColor = {};
  roseGrid.innerHTML = '';
  document.getElementById('rose').classList.remove('done');
  document.getElementById('roseWrap').classList.remove('done');
  roseHint.textContent = 'Pick a color, then tap or drag over the glowing squares.' + (('ontouchstart' in window) ? ' Pinch with two fingers to zoom.' : '');
  setZoom(1);
  touches = {};
  pinch = null;

  for (var r = 0; r < ROSE.length; r++) {
    for (var c = 0; c < ROSE[r].length; c++) {
      var letter = ROSE[r].charAt(c);
      var cell = document.createElement('div');
      cell.className = 'cell';
      cell.dataset.color = letter;
      roseLeft++;
      roseLeftByColor[letter] = (roseLeftByColor[letter] || 0) + 1;
      roseGrid.appendChild(cell);
    }
  }

  var palette = document.getElementById('palette');
  palette.innerHTML = '';
  for (var key in ROSE_COLORS) {
    palette.appendChild(makeSwatch(key));
  }
}

// zoom: two fingers on a touch screen only (pinch to zoom, drag with two fingers to move). No zoom on desktop.
var roseZoom = 1;
var roseView = document.getElementById('roseView');
var touches = {};   // active fingers: pointerId -> {x, y}
var pinch = null;   // {dist, zoom, cx, cy} while two fingers are down
function setZoom(z) {
  roseZoom = Math.max(1, Math.min(4, z));
  document.getElementById('roseWrap').style.setProperty('--zoom', roseZoom);
}
function touchCount() { return Object.keys(touches).length; }
function pinchInfo() {
  var ids = Object.keys(touches);
  var p = touches[ids[0]], q = touches[ids[1]];
  return { dist: Math.hypot(p.x - q.x, p.y - q.y), cx: (p.x + q.x) / 2, cy: (p.y + q.y) / 2 };
}
function pinchMove() {
  var p = pinchInfo();
  var rect = roseView.getBoundingClientRect();
  var ratio = Math.max(1, Math.min(4, pinch.zoom * p.dist / pinch.dist)) / roseZoom;
  var px = roseView.scrollLeft + pinch.cx - rect.left;   // picture point under the previous center
  var py = roseView.scrollTop + pinch.cy - rect.top;
  setZoom(roseZoom * ratio);
  roseView.scrollLeft = px * ratio - (p.cx - rect.left);
  roseView.scrollTop = py * ratio - (p.cy - rect.top);
  pinch.cx = p.cx;
  pinch.cy = p.cy;
}

// separate function so each swatch remembers its own key
function makeSwatch(key) {
  var sw = document.createElement('div');
  sw.className = 'swatch';
  sw.dataset.color = key;
  sw.style.background = ROSE_COLORS[key];
  sw.addEventListener('click', function () { pickColor(key); });
  return sw;
}

function pickColor(key) {
  rosePicked = key;
  var swatches = document.querySelectorAll('.swatch');
  for (var i = 0; i < swatches.length; i++) {
    swatches[i].classList.toggle('sel', swatches[i].dataset.color === key);
  }
  // make every unpainted square of this color glow
  var cells = roseGrid.children;
  for (var j = 0; j < cells.length; j++) {
    var isTarget = cells[j].dataset.color === key && !cells[j].classList.contains('painted');
    cells[j].classList.toggle('hint', isTarget);
  }
}

// finds the square under the finger and tries to paint it
function paintAt(e, isTap) {
  var cell = document.elementFromPoint(e.clientX, e.clientY);
  if (!cell || !cell.classList.contains('cell') || cell.classList.contains('painted')) return;
  if (!rosePicked) { roseHint.textContent = 'Pick a color first!'; return; }
  if (cell.dataset.color !== rosePicked) {
    if (isTap) {   // wrong color: a little wobble on tap, nothing while dragging
      cell.classList.add('nope');
      setTimeout(function () { cell.classList.remove('nope'); }, 400);
    }
    return;
  }
  cell.style.background = ROSE_COLORS[rosePicked];
  cell.classList.remove('hint');
  cell.classList.add('painted');
  roseLeft--;
  roseLeftByColor[rosePicked]--;
  if (roseLeftByColor[rosePicked] === 0) {
    document.querySelector('.swatch[data-color="' + rosePicked + '"]').classList.add('done');
  }
  if (roseLeft === 0) {
    roseHint.textContent = '';
    setTimeout(function () {
      setZoom(1);
      document.getElementById('rose').classList.add('done');
      document.getElementById('roseWrap').classList.add('done');   // the real photo fades in over the pixels
    }, 700);
  }
}

roseGrid.addEventListener('pointerdown', function (e) {
  if (e.pointerType === 'touch') {
    touches[e.pointerId] = { x: e.clientX, y: e.clientY };
    if (touchCount() === 2) {   // second finger: stop painting, start pinching
      roseDown = false;
      var p = pinchInfo();
      pinch = { dist: p.dist, zoom: roseZoom, cx: p.cx, cy: p.cy };
      return;
    }
    if (touchCount() > 2) return;
  }
  roseDown = true;
  paintAt(e, true);
});
roseGrid.addEventListener('pointermove', function (e) {
  if (e.pointerType === 'touch' && touches[e.pointerId]) {
    touches[e.pointerId] = { x: e.clientX, y: e.clientY };
    if (pinch && touchCount() === 2) { pinchMove(); return; }
  }
  if (roseDown) paintAt(e, false);
});
function endTouch(e) {
  delete touches[e.pointerId];
  if (touchCount() < 2) pinch = null;
  roseDown = false;
}
window.addEventListener('pointerup', endTouch);
window.addEventListener('pointercancel', endTouch);

document.getElementById('roseBtn').addEventListener('click', function (e) {
  goTo('final', e.clientX, e.clientY);
});