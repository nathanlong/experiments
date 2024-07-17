import "./style.css";

export const debounce = (callback, wait) => {
  let timeoutId = null;
  return (...args) => {
    window.clearTimeout(timeoutId);
    timeoutId = window.setTimeout(() => {
      callback.apply(null, args);
    }, wait);
  };
};

export class Tracker {
  constructor(el) {
    this.el = el;

    // constant values
    this.speed = 0.05;
    this.scaleMax = 3;
    this.scaleMin = 1;
    this.scaleConstant = 400;
    this.scaleSpeed = 0.1;

    // computed values
    this.bounds = null;
    this.buttonBounds = null;
    this.xStart = null;
    this.yStart = null;
    this.mouse = { x: null, y: null };
    this.pos = { x: null, y: null };
    this.diff = { x: null, y: null };
    this.buttonCenter = { x: null, y: null };
    this.distance = null;
    this.scaleDiff = null;
    this.scaleOverride = null;
    this.currentScale = 0;

    // user values
    this.radius = this.el.dataset.radius ?? 100;
    this.color = this.el.dataset.color ?? "white";
    this.stroke = this.el.dataset.stroke ?? "transparent";
    this.strokeWidth = this.el.dataset.strokeWidth ?? 0;

    // element
    this.target = this.el.querySelector('[data-target]');

    // init
    this.connect()
  }

  connect() {
    const options = {
      root: null,
      threshold: 0,
    };

    this.observer = new IntersectionObserver(this.intersect, options);
    this.observer.observe(this.el);
  }

  // wait to initialize until element is in the viewport
  intersect = (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        this.initSVG();
        // detach once initialized
        this.observer.unobserve(entry.target);
      }
    });
  };

  handleClick = (e) => {
    if (e.target.closest('[data-module="tracker"]')) {
      this.scaleOverride = true;
    }
  };

  // TODO: debounce this call
  handleScroll = () => {
    this.debouncedMeasure();
  };

  handleMouse = (e) => {
    // console.log(e);
    this.mouse.x = e.clientX;
    this.mouse.y = e.clientY;
  };

  // run initial calculations, attach events, and start the loop
  initSVG() {
    this.measure();

    // set initial values
    this.xStart = this.bounds.width / 2;
    this.yStart = this.bounds.height / 2;
    this.mouse = { x: this.xStart, y: this.yStart };
    this.pos = { x: this.xStart, y: this.yStart };

    window.addEventListener("mousemove", this.handleMouse);
    window.addEventListener("scroll", this.handleScroll);
    window.addEventListener("click", this.handleClick);
    this.drawCursor();
    this.loop();
  }

  // prevent running expensive calculations too often via scroll
  debouncedMeasure = debounce(() => this.measure(), 250);

  measure() {
    this.bounds = this.el.getBoundingClientRect();
    this.buttonBounds = this.target.getBoundingClientRect();

    (this.buttonCenter.x =
      this.buttonBounds.left + this.buttonBounds.width / 2),
      (this.buttonCenter.y =
        this.buttonBounds.top + this.buttonBounds.height / 2);
  }

  // measurements needed on each loop
  setParamsDiffs() {
    // find distance between mouse and current position
    this.diff.x = this.mouse.x - this.pos.x;
    this.diff.y = this.mouse.y - this.pos.y - this.bounds.top;
    // increment distance by speed
    this.pos.x += this.diff.x * this.speed;
    this.pos.y += this.diff.y * this.speed;
    // BY THE POWER OF PYTHAGORAS, find the distance between mouse and button center
    this.distance = parseFloat(
      Math.hypot(
        this.pos.x - this.buttonCenter.x,
        this.pos.y - this.buttonCenter.y,
      ).toFixed(1),
    );
    // check for scale override for scale approaching button and click/pulse
    this.scaleTarget = Math.min(
      this.scaleMax,
      Math.max(this.scaleMin, this.scaleConstant / this.distance),
    );
    const newScale =
      this.scaleTarget > this.currentScale
        ? (this.currentScale += this.scaleSpeed)
        : (this.currentScale -= this.scaleSpeed);

    const setScale = this.scaleOverride ? this.currentScale * 2.5 : newScale;

    this.scale = `scale(${setScale})`;
    this.currentScale = setScale;

    // console.log(this.scaleTarget, this.distance)

    if (this.scaleOverride) {
      this.scaleOverride = false;
    }
  }

  drawCursor() {
    this.widthContainer = this.el.offsetWidth;
    this.heightContainer = this.el.offsetHeight;
    this.cursorSVG = `<svg
      width="${this.widthContainer}"
      height="${this.heightContainer}"
      viewbox="0 0 ${this.widthContainer} ${this.heightContainer}"
      preserveAspectRatio="${this.preserveAspectRatio || "none"}"
      style="background: none; position: absolute; inset: 0; pointer-events: none; ">
        <g class="cta-cursor">
          <circle
            r=${this.radius}
            cx=${this.pos.x}
            cy=${this.pos.y}
            fill="${this.color}"
            fill-opacity="1"
            stroke="${this.stroke}"
            stroke-width="${this.strokeWidth}"
            stroke-opacity="1"
            vector-effect="non-scaling-stroke"
            style="transform-origin: ${this.pos.x}px ${
              this.pos.y
            }px; transition: transform 250ms linear;">
          </circle>
      </g>
    </svg>`;
    this.el.insertAdjacentHTML("beforeend", this.cursorSVG);
    this.svg = this.el.querySelector("svg");
    this.cursor = this.el.querySelectorAll(".cta-cursor circle");
  }

  setCursor() {
    for (const [i, cursor] of this.cursor.entries()) {
      cursor.setAttribute("cx", this.pos.x);
      cursor.setAttribute("cy", this.pos.y);
      cursor.style.transformOrigin = `${this.pos.x}px ${this.pos.y}px`;
      cursor.style.transform = this.scale;
    }
  }

  loop() {
    this.setParamsDiffs();
    this.setCursor();
    this.loopReq = requestAnimationFrame(() => this.loop());
  }

  disconnect() {
    this.observer.disconnect();
    this.svg.remove();
    cancelAnimationFrame(this.loopReq);
    window.removeEventListener("mousemove", this.handleMouse);
    window.removeEventListener("scroll", this.handleScroll);
    window.removeEventListener("click", this.handleClick);
  }
}

const el = document.querySelector('[data-module="tracker"]')
const init = new Tracker(el)
