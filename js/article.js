// Article page script: table of contents, fade in on scroll and the reading progress bar

const headings = document.querySelectorAll(".article-body h2");
const tocList = document.getElementById("toc-list");

/* Table of contents, built from the h2 headings */

// "Čo som sa naučil" becomes "co-som-sa-naucil"
function createSlug(text) {
  let slug = text.toLowerCase();
  slug = slug.normalize("NFD").replace(/[\u0300-\u036f]/g, ""); // removes the accents
  slug = slug.replace(/[^a-z0-9]+/g, "-");
  slug = slug.replace(/^-|-$/g, "");
  return slug;
}

headings.forEach((heading, index) => {
  // a heading can have its own id, if not it gets one from its text
  if (heading.id === "") {
    let id = createSlug(heading.textContent);

    // empty or already used id, fall back to a number
    if (id === "" || document.getElementById(id)) {
      id = "sekcia-" + (index + 1);
    }

    heading.id = id;
  }

  const link = document.createElement("a");
  link.href = "#" + heading.id;
  link.textContent = heading.dataset.toc || heading.textContent; // data-toc is a shorter name for the table of contents
  tocList.appendChild(link);
});

const tocLinks = tocList.querySelectorAll("a");

function setActiveLink(id) {
  tocLinks.forEach((link) => {
    if (link.getAttribute("href") === "#" + id) {
      link.classList.add("is-active");
    } else {
      link.classList.remove("is-active");
    }
  });
}

// a heading is the current one when it is in the upper part of the screen
const headingObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      setActiveLink(entry.target.id);
    }
  });
}, { rootMargin: "-15% 0px -75% 0px" });

headings.forEach((heading) => {
  headingObserver.observe(heading);
});

if (headings.length > 0) {
  setActiveLink(headings[0].id);
}

/* Every block in the article fades in when it scrolls into view */

const blocks = document.querySelectorAll(".article-body > *");

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add("is-visible");
      revealObserver.unobserve(entry.target); // it only needs to happen once
    }
  });
}, { rootMargin: "0px 0px -8% 0px" });

blocks.forEach((block) => {
  block.classList.add("reveal");
  revealObserver.observe(block);
});

/* Reading progress bar at the top of the page */

const progressBar = document.getElementById("reading-progress");

window.addEventListener("scroll", () => {
  const scrollable = document.documentElement.scrollHeight - window.innerHeight;

  if (scrollable > 0) {
    const progress = window.scrollY / scrollable;
    progressBar.style.transform = "scaleX(" + progress + ")";
  }
});