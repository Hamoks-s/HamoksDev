// image viewer (lightbox), every image in the cover and in the article content opens in it
// to add a new image to it just put the image in the article, nothing else needs to be done

const galleryImages = document.querySelectorAll(".article-cover img, .article-body figure img")

// the viewer is built here, so it does not have to be in the html
const lightbox = document.createElement("div")
lightbox.className = "lightbox"
lightbox.setAttribute("role", "dialog")
lightbox.innerHTML = `
  <div class="lightbox-stage">
    <img class="lightbox-image" src="" alt="" draggable="false">
  </div>
  <button class="lightbox-button lightbox-close" aria-label="Zavrieť">
    <svg class="icon"><use href="#icon-close"></use></svg>
  </button>
  <button class="lightbox-button lightbox-prev" aria-label="Predchádzajúci obrázok">
    <svg class="icon"><use href="#icon-arrow"></use></svg>
  </button>
  <button class="lightbox-button lightbox-next" aria-label="Ďalší obrázok">
    <svg class="icon"><use href="#icon-arrow"></use></svg>
  </button>
  <div class="lightbox-info">
    <p class="lightbox-caption"></p>
    <span class="lightbox-counter"></span>
  </div>
`
document.body.appendChild(lightbox)

const lightboxStage = lightbox.querySelector(".lightbox-stage")
const lightboxImage = lightbox.querySelector(".lightbox-image")
const lightboxCaption = lightbox.querySelector(".lightbox-caption")
const lightboxCounter = lightbox.querySelector(".lightbox-counter")

let currentIndex = 0

// zoom and position of the big image
let imageScale = 1
let imageX = 0
let imageY = 0

// showing the image on the screen

function limitImagePosition() {
  // the image can not be dragged completely out of the screen
  const maxX = (lightboxImage.offsetWidth * imageScale) / 2
  const maxY = (lightboxImage.offsetHeight * imageScale) / 2

  if (imageX > maxX) {
    imageX = maxX
  }
  if (imageX < -maxX) {
    imageX = -maxX
  }
  if (imageY > maxY) {
    imageY = maxY
  }
  if (imageY < -maxY) {
    imageY = -maxY
  }
}

function updateImage() {
  limitImagePosition()
  lightboxImage.style.transform = "translate(" + imageX + "px, " + imageY + "px) scale(" + imageScale + ")"

  if (imageScale > 1) {
    lightbox.classList.add("is-zoomed")
  } else {
    lightbox.classList.remove("is-zoomed")
  }
}

function resetZoom() {
  imageScale = 1
  imageX = 0
  imageY = 0
  updateImage()
}

// zooms to the point of the screen where the mouse or the fingers are
function zoomAt(newScale, pointX, pointY) {
  if (newScale < 1) {
    newScale = 1
  }
  if (newScale > 5) {
    newScale = 5
  }

  // the image is in the center of the screen, so the point is measured from the center
  const fromCenterX = pointX - window.innerWidth / 2
  const fromCenterY = pointY - window.innerHeight / 2
  const ratio = newScale / imageScale

  imageX = fromCenterX - (fromCenterX - imageX) * ratio
  imageY = fromCenterY - (fromCenterY - imageY) * ratio
  imageScale = newScale

  updateImage()
}

function showImage(index) {
  // the % makes it loop, after the last image comes the first one and the other way around
  currentIndex = (index + galleryImages.length) % galleryImages.length

  const image = galleryImages[currentIndex]
  const figcaption = image.closest("figure").querySelector("figcaption")

  lightboxImage.src = image.src
  lightboxImage.alt = image.alt
  lightboxCaption.textContent = figcaption ? figcaption.textContent : ""
  lightboxCounter.textContent = (currentIndex + 1) + " / " + galleryImages.length
  resetZoom()
}

function showNext() {
  showImage(currentIndex + 1)
}

function showPrevious() {
  showImage(currentIndex - 1)
}

function openLightbox(index) {
  showImage(index)
  lightbox.classList.add("is-open")
  document.body.classList.add("lightbox-is-open")
}

function closeLightbox() {
  lightbox.classList.remove("is-open")
  document.body.classList.remove("lightbox-is-open")
}

// opening, closing and going through the images

galleryImages.forEach((image, index) => {
  image.addEventListener("click", () => {
    openLightbox(index)
  })
})

lightbox.querySelector(".lightbox-close").addEventListener("click", closeLightbox)
lightbox.querySelector(".lightbox-prev").addEventListener("click", showPrevious)
lightbox.querySelector(".lightbox-next").addEventListener("click", showNext)

document.addEventListener("keydown", (event) => {
  if (!lightbox.classList.contains("is-open")) {
    return
  }

  if (event.key === "Escape") {
    closeLightbox()
  }
  if (event.key === "ArrowRight") {
    showNext()
  }
  if (event.key === "ArrowLeft") {
    showPrevious()
  }
})

// zooming with the mouse wheel

lightboxStage.addEventListener("wheel", (event) => {
  event.preventDefault()

  if (event.deltaY < 0) {
    zoomAt(imageScale * 1.2, event.clientX, event.clientY)
  } else {
    zoomAt(imageScale / 1.2, event.clientX, event.clientY)
  }
}, { passive: false })

// mouse and touch: click or tap zooms, dragging moves the zoomed image,
// two fingers zoom, swiping to the side changes the image

const pointers = new Map() // every finger (or mouse) that is touching the screen right now
let pressTarget = null
let pressStartX = 0
let pressStartY = 0
let pressMoved = 0 // how far the finger moved since it touched the screen
let wasPinching = false
let pinchStartDistance = 0
let pinchStartScale = 1

function getPointersDistance() {
  const points = Array.from(pointers.values())
  const distanceX = points[0].x - points[1].x
  const distanceY = points[0].y - points[1].y
  return Math.hypot(distanceX, distanceY)
}

lightboxStage.addEventListener("pointerdown", (event) => {
  if (event.button !== 0) {
    return
  }

  lightboxStage.setPointerCapture(event.pointerId)
  pointers.set(event.pointerId, { x: event.clientX, y: event.clientY })
  lightbox.classList.add("is-moving") // the image follows the finger without delay

  if (pointers.size === 1) {
    pressTarget = event.target
    pressStartX = event.clientX
    pressStartY = event.clientY
    pressMoved = 0
    wasPinching = false
  }

  if (pointers.size === 2) {
    pinchStartDistance = getPointersDistance()
    pinchStartScale = imageScale
    wasPinching = true
  }
})

lightboxStage.addEventListener("pointermove", (event) => {
  if (!pointers.has(event.pointerId)) {
    return
  }

  const previous = pointers.get(event.pointerId)
  const moveX = event.clientX - previous.x
  const moveY = event.clientY - previous.y
  pointers.set(event.pointerId, { x: event.clientX, y: event.clientY })

  // two fingers, zooming
  if (pointers.size === 2) {
    const points = Array.from(pointers.values())
    const centerX = (points[0].x + points[1].x) / 2
    const centerY = (points[0].y + points[1].y) / 2
    const newScale = pinchStartScale * (getPointersDistance() / pinchStartDistance)
    zoomAt(newScale, centerX, centerY)
    return
  }

  // one finger
  pressMoved += Math.abs(moveX) + Math.abs(moveY)

  if (imageScale > 1) {
    imageX += moveX
    imageY += moveY
    updateImage()
  }
})

lightboxStage.addEventListener("pointerup", (event) => {
  if (!pointers.has(event.pointerId)) {
    return
  }

  pointers.delete(event.pointerId)

  // another finger is still touching, the gesture is not over yet
  if (pointers.size > 0) {
    return
  }

  lightbox.classList.remove("is-moving")

  if (wasPinching) {
    return
  }

  const swipeX = event.clientX - pressStartX
  const swipeY = event.clientY - pressStartY

  if (pressMoved < 6) {
    // just a click or a tap
    if (pressTarget === lightboxImage) {
      if (imageScale > 1) {
        resetZoom()
      } else {
        zoomAt(2.5, event.clientX, event.clientY)
      }
    } else {
      closeLightbox() // clicked on the dark background
    }
  } else if (imageScale === 1 && Math.abs(swipeX) > 60 && Math.abs(swipeX) > Math.abs(swipeY)) {
    if (swipeX < 0) {
      showNext()
    } else {
      showPrevious()
    }
  }
})

lightboxStage.addEventListener("pointercancel", (event) => {
  pointers.delete(event.pointerId)
  lightbox.classList.remove("is-moving")
})