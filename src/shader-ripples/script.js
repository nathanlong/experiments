import './style.css'
import ripples from './ripples.js'

const canvasWrapper = document.querySelector('[data-ripples]')

// feed it a wrapper, it will create the canvas element inside of it
// allows configurable options
ripples(canvasWrapper, {
  resolution: 768, // how much detail, lower numbers mean less quality but higher performance
  dropRadius: 45, //how big to make the rain drops
  rainDropInterval: 1000, // how fast in between raindrops (ms)
  perturbance: 50, // how much distortion each drop causes
  interactive: true, // track the cursor to create ripples
});

// TODO: add examples of functionality (start/stop rain, change colors, etc)
