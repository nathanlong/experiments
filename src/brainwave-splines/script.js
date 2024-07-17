import './style.css'
import { spline } from "@georgedoescode/spline";
import { createNoise2D } from "simplex-noise";

export class Spline {
  constructor(el) {
    this.el = el;
    this.paths = [...this.el.querySelectorAll("path")];
    this.noise2D = createNoise2D();
    this.points = [];
    this.noiseStep = 0.002;
    this.pushPoints();
    this.animate();
  }

  pushPoints() {
    this.paths.forEach(() => {
      const point = this.createPoints();
      this.points.push(point);
    });
  }

  createPoints() {
    const points = [];
    // how many points do we need
    const numPoints = 6;
    // used to equally space each point around the circle
    const angleStep = (Math.PI * 2) / numPoints;
    // the radius of the circle
    const rad = 75;

    for (let i = 1; i <= numPoints; i++) {
      // x & y coordinates of the current point
      const theta = i * angleStep;

      const x = 100 + Math.cos(theta) * rad;
      const y = 100 + Math.sin(theta) * rad;

      // store the point's position
      points.push({
        x: x,
        y: y,
        // we need to keep a reference to the point's original point for when we modulate the values later
        originX: x,
        originY: y,
        // more on this in a moment!
        noiseOffsetX: Math.random() * 1000,
        noiseOffsetY: Math.random() * 1000,
      });
    }

    return points;
  }


  animate = () => {
    this.paths.forEach((path, index) => {
      path.setAttribute("d", spline(this.points[index], 1, true));

      // for every point...
      for (let i = 0; i < this.points[index].length; i++) {
        const point = this.points[index][i];

        // return a pseudo random value between -1 / 1 based on this point's current x, y positions in "time"
        const nX = this.noise(this.noise2D, point.noiseOffsetX, point.noiseOffsetX);
        const nY = this.noise(this.noise2D, point.noiseOffsetY, point.noiseOffsetY);
        // map this noise value to a new value, somewhere between it's original location -20 and it's original location + 20
        const x = this.newValue(nX, -1, 1, point.originX - 10, point.originX + 10);
        const y = this.newValue(nY, -1, 1, point.originY - 10, point.originY + 10);

        // update the point's current coordinates
        point.x = x;
        point.y = y;

        // progress the point's x, y values through "time"
        point.noiseOffsetX += this.noiseStep;
        point.noiseOffsetY += this.noiseStep;
      }
    });

    requestAnimationFrame(this.animate);
  }

  newValue(n, start1, end1, start2, end2) {
    return ((n - start1) / (end1 - start1)) * (end2 - start2) + start2;
  }

  noise(noise, x, y) {
    return noise(x, y);
  }
}

// attach

const el = document.querySelector('[data-spline]')
const init = new Spline(el)
