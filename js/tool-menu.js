const toolCards = document.querySelectorAll(".tool-card");
const filterButtons = document.querySelectorAll(".filter");
const searchInput = document.getElementById("tool-search");
const emptyMessage = document.getElementById("tool-empty");
const toolCount = document.getElementById("tool-count");

let activeCategory = "all";

// slovak: 1 nástroj, 2-4 nástroje, 0 and 5+ nástrojov
function getToolWord(count) {
    if (count === 1) {
        return "nástroj";
    }

    if (count >= 2 && count <= 4) {
        return "nástroje";
    }

    return "nástrojov";
}

// update the tool count
function showToolCount() {
    const total = toolCards.length;
    toolCount.textContent = total + " " + getToolWord(total);
}

// filtering when searching the tools 
function filterTools() {
    const searchText = searchInput.value.trim().toLowerCase();
    let visibleCount = 0;

    for (const card of toolCards) {
        const matchesCategory = activeCategory === "all" || card.dataset.category === activeCategory;
        const matchesSearch = card.textContent.toLowerCase().includes(searchText);

        if (matchesCategory && matchesSearch) {
        card.hidden = false;
        visibleCount++;
        } else {
        card.hidden = true;
        }
    }

    emptyMessage.hidden = visibleCount > 0;
}

// when a filter button is clicked
function selectFilter(button) {
    // remove the active class from all buttons
    for (const otherButton of filterButtons) {
        otherButton.classList.remove("is-active");
    }

    button.classList.add("is-active");
    activeCategory = button.dataset.filter;
    filterTools();
}

// click function for the filter buttons
for (const button of filterButtons) {
    button.addEventListener("click", function () {
        
        selectFilter(button);
    });
}

searchInput.addEventListener("input", filterTools);

showToolCount();

// header link
Promise.all([headerReady]).then(() => headerLinksActive("tools"));
