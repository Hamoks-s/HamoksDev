// header continuing down when scrolled
const header = document.querySelector('header');

// update header when certain length is scrolled
function updateHeader() {
    header.classList.toggle('is-scrolled', window.scrollY > 40);
}

window.addEventListener('scroll', updateHeader, { passive: true });
updateHeader(); // run once on load, in case the page opens already scrolled

// the hero subtext typing
const tagline = document.getElementById('tagline');

if (tagline) {
    const text = tagline.dataset.text;
    let count = 0;

    tagline.classList.add('is-typing');
    tagline.innerHTML = '<span class="tagline-typed"></span><span class="tagline-hidden"></span>';
    const typed = tagline.children[0];
    const hidden = tagline.children[1];
    hidden.textContent = text;

    function typeNext() {
        count++;
        typed.textContent = text.slice(0, count);
        hidden.textContent = text.slice(count);

        if (count < text.length) {
            setTimeout(typeNext, 48 + Math.random() * 55); // random delay so it feels human
        }
    }

    setTimeout(typeNext, 900); // wait for the title animation
}

// the mobile menu functions
const menu = document.getElementById('mobile-menu');
const openButton = document.getElementById('menu-button');
const closeButton = document.getElementById('menu-close');
const desktopQuery = window.matchMedia('(min-width: 700px)');

function openMenu() {
    menu.showModal();
    document.body.classList.add('menu-is-open');
}

function closeMenu() {
    if (!menu.open) return; // nothing to close

    menu.classList.add('is-closing');
    setTimeout(function () {
        menu.close();
    }, 400);
}

function cleanUp() {
    menu.classList.remove('is-closing');
    document.body.classList.remove('menu-is-open');
}

// clicking the dark area next to the menu closes it
function handleMenuClick(event) {
    if (event.clientX > menu.getBoundingClientRect().right) {
        closeMenu();
    }
}

// resizing to a desktop width closes it
function handleResize() {
    if (desktopQuery.matches) {
        closeMenu();
    }
}

openButton.addEventListener('click', openMenu);
closeButton.addEventListener('click', closeMenu);
menu.addEventListener('click', handleMenuClick);
menu.addEventListener('close', cleanUp);
desktopQuery.addEventListener('change', handleResize);

menu.querySelectorAll('a').forEach(function (link) {
    link.addEventListener('click', closeMenu);
}); 