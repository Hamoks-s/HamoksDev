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