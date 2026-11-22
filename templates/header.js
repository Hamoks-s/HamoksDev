const headerBox = document.getElementById("header");

async function load() {
    const response = await fetch("/templates/header.html");

    if (!response.ok) {
        console.error("Could not load the header");
        return;
    }
    headerBox.outerHTML = await response.text();
    const newHeader = document.querySelector("header");
    newHeader.getBoundingClientRect();
    newHeader.classList.remove("is-loading");
}

const headerReady = load();

let cursor_glow;

let mouse_x = 0;
let mouse_y = 0;
let glow_x = 0;
let glow_y = 0;
let glow_is_moving = false;

// Moves the glow a bit closer to the mouse on every frame.
// That is why it lags behind a little.
function move_glow() {
    glow_x = glow_x + (mouse_x - glow_x) * 0.14;
    glow_y = glow_y + (mouse_y - glow_y) * 0.14;

    cursor_glow.style.transform = 'translate3d(' + glow_x + 'px, ' + glow_y + 'px, 0)';

    const distance_left = Math.abs(mouse_x - glow_x) + Math.abs(mouse_y - glow_y);

    if (distance_left > 0.5) {
        requestAnimationFrame(move_glow);
    } else {
        glow_is_moving = false;
    }
}

function on_mouse_move(event) {
    if (event.pointerType !== 'mouse') {
        return;
    }

    // on the first move, put the glow right under the mouse and show it
    if (!cursor_glow.classList.contains('is-visible')) {
        glow_x = event.clientX;
        glow_y = event.clientY;
        cursor_glow.classList.add('is-visible');
    }

    mouse_x = event.clientX;
    mouse_y = event.clientY;

    if (!glow_is_moving) {
        glow_is_moving = true;
        requestAnimationFrame(move_glow);
    }
}

Promise.all([headerReady]).then(startGlow);

function startGlow(){
    cursor_glow = document.getElementById('cursor-glow');
    window.addEventListener('pointermove', on_mouse_move, { passive: true });
}

