import './style.css'

// 01 - INFINITE SCROLLING BACKGROUND
//
// We could probably reach in and measure the dimensions of the background
// image dynamically, but that feels a little gross, so lets just assume we
// know the size of the image
//
// We also know the image is set to 100% width, so we can measure the window
// and figure out how tall the background image will display at
//
// image specs = 1920x1920 = 1 ratio

const windowW = window.innerWidth
let imageRatio = 1
let animSpeed = 80
let backgroundSelect = 1
let root = document.documentElement

// set a ratio because we're setting the image to full browser width, so the
// height is going to be dependent on window size and image ratio
function bgRatio(full, ratio) {
  root.style.setProperty('--base-height', full / ratio + 'px')
}

bgRatio(windowW, imageRatio)

// button controls for stutter checking
document
  .getElementById('speed-up')
  .addEventListener('mousedown', function () {
    animSpeed = animSpeed / 2
    root.style.setProperty('--animation-duration', animSpeed + 's')
  })

// reset speed
document.getElementById('reset').addEventListener('mousedown', function () {
  animSpeed = 80
  root.style.setProperty('--animation-duration', animSpeed + 's')
})

// change background to test on other areas, and to reinitiatlize the ratio
document.getElementById('change').addEventListener('mousedown', function () {
  const el = document.querySelector('.image-ribbon')
  if (backgroundSelect === 1) {
    el.style.backgroundImage =
      'url(https://user-images.githubusercontent.com/623568/172631868-553412a8-2f95-4ac3-a7c3-d43ec8c69f4d.jpg)'
    // 1920 x 1920
    bgRatio(windowW, 1)
    backgroundSelect = 2
  } else if (backgroundSelect === 2) {
    el.style.backgroundImage =
      'url(https://user-images.githubusercontent.com/623568/172635964-166ab9f0-64d4-4c41-93bf-b3d01859046f.png)'
    // 1440 x 1395
    bgRatio(windowW, 1.03225806)
    backgroundSelect = 3
  } else if (backgroundSelect === 3) {
    el.style.backgroundImage =
      'url(https://user-images.githubusercontent.com/623568/172632914-7726f517-ea2d-4a82-a4dd-26b541e125d9.jpg)'
    // 1920 x 1920
    bgRatio(windowW, 1)
    backgroundSelect = 1
  }
})
