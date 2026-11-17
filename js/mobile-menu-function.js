let header;
let menu;
let openButton;
let closeButton;

function setupMenu() {
    header = document.querySelector('header');
    window.addEventListener('scroll', updateHeader, { passive: true });
    updateHeader(); // run once on load, in case the page opens already scrolled

    menu = document.getElementById('mobile-menu');
    openButton = document.getElementById('menu-button');
    
    closeButton = document.getElementById('menu-close');

    openButton.addEventListener('click', openMenu);
    closeButton.addEventListener('click', closeMenu);
    menu.addEventListener('click', handleMenuClick);
    menu.addEventListener('close', cleanUp);
    desktopQuery.addEventListener('change', handleResize);

    menu.querySelectorAll('a').forEach(function (link) {
        link.addEventListener('click', closeMenu);
    });
    
}

// header continuing down when scrolled
// update header when certain length is scrolled
function updateHeader() {
    header.classList.toggle('is-scrolled', window.scrollY > 40);
}

// the mobile menu functions
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

Promise.all([headerReady, menuReady]).then(setupMenu);