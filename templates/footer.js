const footerBox = document.getElementById("footer");

async function load() {
    const response = await fetch("/templates/footer.html");

    if (!response.ok) {
        console.error("Could not load the footer");
        return;
    }
    footerBox.outerHTML = await response.text();
}

load();