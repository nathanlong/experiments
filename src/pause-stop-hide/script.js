import './style.css'
import { gsap } from 'gsap'

// User Animation Settings Storage ---------------------------------------------
//
// There are two parts to this toggle:
// 1. The initial blocking check in a <script> tag in the <body> that sets
//    initial values and CSS variables (see .njk file)
// 2. This part that manages updating the UI and handling changes
//
// Original concept adapted from the light/dark theme technique at:
// https://www.joshwcomeau.com/react/dark-mode/

const root = document.documentElement
const motionModeToggle = document.getElementById('toggle-motion')
const motionInitialValue = root.style.getPropertyValue('--initial-motion-mode')

// Set the UI based off the result of the intial blocking check which is stored
// in the CSS variable
motionModeToggle.checked = motionInitialValue === 'no-preference' ? true : false

// We only need to set a value if the user interacts with the toggle
function setMotionMode(newValue) {
	window.localStorage.setItem('motion-mode', newValue)
	root.style.setProperty(
		'--play-state',
		newValue === 'reduced' ? 'paused' : 'running'
	)
	root.style.setProperty(
		'--transition-toggle',
		newValue === 'reduced' ? '0' : '1'
	)
	root.style.setProperty('--initial-motion-mode', newValue)

	// To make things take effect immediately for all motion surface areas,
	// reload. In the future this could be handled more effectively.
	location.reload()
}

// Transform the true/false into the values we need for
function motionModeChange() {
	const newValue = motionModeToggle.checked ? 'no-preference' : 'reduced'
	setMotionMode(newValue)
}
motionModeToggle.addEventListener('change', motionModeChange)

// utility function to return a boolean based on motion settings
function motionAllow() {
	return motionInitialValue === 'no-preference' ? true : false
}

// WAAPI
// -----------------------------------------------------------------------------

const tumbling = [{ transform: 'rotate(0)' }, { transform: 'rotate(360deg)' }]

const tumblingTiming = {
	duration: 3000,
	iterations: Infinity,
}

const el = document.querySelector('.waapi-anim')

// run animation if user has animations turned on
if (motionAllow()) {
	el.animate(tumbling, tumblingTiming)
}

// ----- GSAP

let gsapEl = document.querySelector('.gsap-anim')

// there's probably a better way to do this...
// esp. with the new gsap matchMedia util
let tl = motionAllow()
	? gsap
			.timeline({
				repeat: -1,
				yoyo: true,
			})
			.fromTo(
				gsapEl,
				{
					y: 0,
					scaleY: 0.9,
				},
				{
					y: -20,
					scaleY: 1,
					rotation: '20deg',
					duration: 0.6,
					ease: 'power2.out',
				}
			)
	: null

// Destroy preference
document.querySelector('.pref-destroy').addEventListener('click', function () {
	localStorage.removeItem('motion-mode')
})
