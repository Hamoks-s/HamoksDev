// rok v pätičke
// test reakcie
const box = document.getElementById("game");
const bestText = document.getElementById("best");

let state = "idle"; // idle | waiting | go
let timer = null;
let startTime = 0;
let best = null;

function reset() {
  state = "idle";
  box.className = "";
}

box.addEventListener("click", () => {
  if (state === "idle") {
    state = "waiting";
    box.className = "";
    box.textContent = "Čakaj na zelenú...";
    const delay = 1000 + Math.random() * 3000;
    timer = setTimeout(() => {
      state = "go";
      box.className = "go";
      box.textContent = "Klikaj teraz!";
      startTime = performance.now();
    }, delay);
  } else if (state === "waiting") {
    clearTimeout(timer);
    reset();
    box.className = "early";
    box.textContent = "Príliš skoro. Klikni a skús znova.";
  } else if (state === "go") {
    const ms = Math.round(performance.now() - startTime);
    if (best === null || ms < best) best = ms;
    reset();
    box.textContent = ms + " ms. Klikni a skús znova.";
    bestText.textContent = "Najlepší čas: " + best + " ms";
  }
});

const audio = document.querySelector(".player audio");
const playBtn = document.querySelector(".play-btn");
const seek = document.querySelector(".seek");
const time = document.querySelector(".time");

function fmt(s) {
  const m = Math.floor(s / 60);
  const r = Math.floor(s % 60);
  return m + ":" + String(r).padStart(2, "0");
}

function showTime() {
  time.textContent = fmt(audio.currentTime) + " / " + fmt(audio.duration || 0);
}

playBtn.addEventListener("click", () => {
  if (audio.paused) audio.play();
  else audio.pause();
});

audio.addEventListener("play", () => { playBtn.textContent = "❚❚"; });
audio.addEventListener("pause", () => { playBtn.textContent = "▶"; });

audio.addEventListener("loadedmetadata", () => {
  seek.max = audio.duration;
  showTime();
});

audio.addEventListener("timeupdate", () => {
  seek.value = audio.currentTime;
  showTime();
});

seek.addEventListener("input", () => {
  audio.currentTime = seek.value;
});