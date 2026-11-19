const headings = document.querySelectorAll(".article-body h2")
const tocList = document.getElementById("toc-list")

// table of contents (toc), built from the h2 headings 

// "Čo som sa naučil" becomes "co-som-sa-naucil" for an id and href
function createSlug(text) {
  let slug = text.toLowerCase()
  slug = slug.normalize("NFD").replace(/[\u0300-\u036f]/g, "") // removes the accents
  slug = slug.replace(/[^a-z0-9]+/g, "-")
  slug = slug.replace(/^-|-$/g, "")
  return slug
}

// for each heading in the content
headings.forEach((heading, index) => {
  // a heading can have its own id, if not it gets one from its text
  if (heading.id === "") {
    let id = createSlug(heading.textContent)

    // empty or already used id, fall back to a number
    if (id === "" || document.getElementById(id)) {
      id = "sekcia-" + (index + 1)
    }

    heading.id = id
  }

  const link = document.createElement("a")
  link.href = "#" + heading.id // adding the href
  link.textContent = heading.dataset.toc || heading.textContent // data-toc is a shorter name for the table of contents
  tocList.appendChild(link)
})

// the is-active functionality for the links where they light up
const tocLinks = tocList.querySelectorAll("a")

function setActiveLink(id) {
  tocLinks.forEach((link) => {
    if (link.getAttribute("href") === "#" + id) {
      link.classList.add("is-active")
    } else {
      link.classList.remove("is-active")
    }
  })
}

// automamtic lighting up of the links, with what h2 is first on website
const headingObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      setActiveLink(entry.target.id)
    }
  })
}, { rootMargin: "-15% 0px -75% 0px" })

headings.forEach((heading) => {
  headingObserver.observe(heading)
})

if (headings.length > 0) {
  setActiveLink(headings[0].id)
}

// the fading effect when scrolled in view for every block in the article 

const blocks = document.querySelectorAll(".article-body > *")

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add("is-visible")
      revealObserver.unobserve(entry.target) // it only needs to happen once
    }
  })
}, { rootMargin: "0px 0px -8% 0px" })

blocks.forEach((block) => {
  block.classList.add("reveal")
  revealObserver.observe(block)
})

// the progress bar at the top of the page functionality

const progressBar = document.getElementById("reading-progress")

window.addEventListener("scroll", () => {
  const scrollable = document.documentElement.scrollHeight - window.innerHeight

  if (scrollable > 0) {
    const progress = window.scrollY / scrollable
    progressBar.style.transform = "scaleX(" + progress + ")"
  }
})

const images = document.getElementsByName("img")

images.forEach(image => {
    console.log(image)
})