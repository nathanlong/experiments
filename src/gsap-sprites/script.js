import "./style.css";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

// single file data modules
let storage = [];

class Star {
  constructor(el) {
    this.el = el;
    this.timeline = null;
    this.animate();
  }

  animate() {
    this.timeline = gsap.timeline().to(".star-image", {
      x: -1300 + 130,
      duration: 0.75,
      repeat: -1,
      ease: "steps(9)",
    });
  }

  cleanUp() {
    this.timeline.kill();
  }
}

class Phone {
  constructor(el) {
    this.el = el;
    this.timeline = null;
    this.animate();
  }

  frames = 60;
  rows = 10;
  columns = 6;
  frame_width = 300;
  frame_height = 350;

  // in dealing with a two dimensional array of sprites we need to cycle the
  // values for each frame in both directions, so we use a function to help us
  // generate keyframes for x and y transforms

  generateXPosition() {
    let positionArray = [];

    for (let i = 0; i < this.frames; i++) {
      let pos = (i % this.columns) * this.frame_width * -1;
      positionArray.push(pos);
    }

    return positionArray;
  }

  generateYPosition() {
    let positionArray = [];

    for (let i = 0; i < this.frames; i++) {
      let pos =
        Math.max(0, Math.floor(i / this.columns)) * this.frame_height * -1;
      positionArray.push(pos);
    }

    return positionArray;
  }

  animate() {
    // console.log(this.generateXPosition(), this.generateYPosition())

    this.timeline = gsap.timeline().to(".phone-image", {
      keyframes: {
        x: this.generateXPosition(),
        y: this.generateYPosition(),
      },
      ease: `steps(${this.frames - 1})`,
      scrollTrigger: {
        trigger: ".scroll",
        start: "top 30%",
        end: "bottom 30%",
        // end: "+=" + (this.frames * this.frame_height),
        scrub: 1,
        // scrub: true,
        // markers: {startColor:"green", endColor:"red", fontSize:"12px"},
      },
    });
  }

  cleanUp() {
    this.timeline.kill();
  }
}

class Airpods {
  constructor(el) {
    this.el = el;
    this.timeline = null;
    this.context = this.el.getContext("2d");
    this.el.width = 1158;
    this.el.height = 770;
    this.buildImages();
    this.animate();
  }

  images = [];

  frames = 147;

  currentFrame = (index) =>
    `https://www.apple.com/105/media/us/airpods-pro/2019/1299e2f5_9206_4470_b28e_08307a42f19b/anim/sequence/large/01-hero-lightpass/${(index + 1).toString().padStart(4, "0")}.jpg`;

  airpods = {
    frame: 0,
  };

  // create and load image sequence
  buildImages() {
    for (let i = 0; i < this.frames; i++) {
      const img = new Image();
      img.src = this.currentFrame(i);
      this.images.push(img);
    }

    this.images[0].onload = this.render;
  }

  // we use GSAP to increment airpods.frame and attach a custom render
  // function
  animate() {
    this.timeline = gsap.timeline().to(this.airpods, {
      frame: this.frames - 1, // define upper bounds, indexed for 0
      snap: "frame", // snap to nearest whole number of 'frame' or 146
      ease: "none",
      scrollTrigger: {
        trigger: ".canvas-container",
        start: "top",
        end: "bottom",
        scrub: 0.5,
        markers: true,
      },
      onUpdate: this.render,
    });
  }

  render = () => {
    this.context.clearRect(0, 0, this.el.width, this.el.height);
    this.context.drawImage(this.images[this.airpods.frame], 0, 0);
    // console.log(this.airpods.frame)
  };

  cleanUp() {
    this.timeline.kill();
  }
}

const dataModules = [...document.querySelectorAll("[data-module]")];
dataModules.forEach((element, index) => {
  element.dataset.module.split(" ").forEach(function (ModuleName) {
    // console.log(index, ModuleName, element);
    switch (ModuleName) {
      case "star":
        storage.push(new Star(element));
        break;
      case "phone":
        storage.push(new Phone(element));
        break;
      case "airpods":
        storage.push(new Airpods(element));
        break;
      default:
        break;
    }
  });
});

// HMR
if (import.meta.hot) {
  import.meta.hot.accept();
  import.meta.hot.dispose(() => {
    dataModules.forEach((element) => {
      element.dataset.module.split(" ").forEach(function (moduleName, index) {
        storage[index].cleanUp();
      });
    });
  });
}
