import "./style.css";
import { initCanvasGradients } from "./gradient.ts";

// Wire up every [data-component="canvas-gradient"] canvas from its
// data-attributes. instances is keyed by element and carries a destroy()
// that tears all of them down.
const instances = initCanvasGradients();

// Demo: cycle the first instance through a few palettes on click.
const button = document.querySelector<HTMLButtonElement>(
  '[data-component="gradient-tween"]'
);
const gradient = instances.values().next().value;

const BGS = [
  "#0a0a1a",
  "#cdb4db",
  "#000814",
  "#386641",
  "#f4f1de",
  "#edede9",
  "#05668d",
];

const COLORS = [
  ["#3b82f6", "#8b5cf6", "#06b6d4", "#ec4899"],
  ["#ffc8dd", "#ffafcc", "#bde0fe", "#a2d2ff"],
  ["#001d3d", "#003566", "#ffc300", "#ffd60a"],
  ["#6a994e", "#a7c957", "#f2e8cf", "#bc4749"],
  ["#e07a5f", "#3d405b", "#81b29a", "#f2cc8f"],
  ["#d6ccc2", "#f5ebe0", "#e3d5ca", "#d5bdaf"],
  ["#028090", "#00a896", "#02c39a", "#f0f3bd"],
];

let colorIndex = 1;
button?.addEventListener("click", () => {
  gradient?.tween({ bg: BGS[colorIndex], colors: COLORS[colorIndex] }, 1500);
  colorIndex = (colorIndex + 1) % COLORS.length;
});

// HMR: tear down WebGL contexts, rAF loops, and listeners before Vite re-runs
// this module, so saves don't stack instances on top of each other.
//
// Rewire this to your own component lifecycle
if (import.meta.hot) {
  import.meta.hot.dispose(() => instances.destroy());
}
