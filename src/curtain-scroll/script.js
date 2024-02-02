import './style.css'

// Title Scroll Crop
//
// All we're doing here is letting the scroll position subtract the max height
// of front side element, which works to create that curtain effect.

const target = document.querySelector('.scroll-hero-front')
const windowH = window.innerHeight
let windowY

window.addEventListener('scroll', function () {
  windowY = window.scrollY
  target.style.maxHeight = Math.max(0, windowH - windowY) + 'px'
})
