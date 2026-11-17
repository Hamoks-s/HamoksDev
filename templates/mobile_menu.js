const menuBox = document.getElementById("mobile-menu");

async function load() {
    const response = await fetch("/templates/mobile_menu.html");

    if (!response.ok) {
        console.error("Could not load the menu");
        return;
    }
    menuBox.outerHTML = await response.text();
}

load();