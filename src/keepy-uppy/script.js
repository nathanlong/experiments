import './style.css'
import Matter from 'matter-js';

let collideScore = 0;
let scoreEl = document.querySelector(".score");

// module aliases
let Engine = Matter.Engine,
  Render = Matter.Render,
  Runner = Matter.Runner,
  Bounds = Matter.Bounds,
  Bodies = Matter.Bodies,
  Common = Matter.Common,
  Composite = Matter.Composite,
  Detector = Matter.Detector,
  Composites = Matter.Composites,
  Vector = Matter.Vector,
  Events = Matter.Events,
  Mouse = Matter.Mouse;

// create an engine
let engine = Engine.create();
let world = engine.world;

// create a renderer
let render = Render.create({
  element: document.body,
  engine: engine,
  options: {
    width: 800,
    height: 800,
    hasBounds: true,
    background: 'transparent',
    wireframeBackground: 'transparent',
    // showAngleIndicator: true,
    // showVelocity: true,
    wireframes: false,
  },
});

Matter.Render.setPixelRatio(render, "auto");
let ctx = render.context;

// add bodies
let rest = 0.9,
  space = 600 / 5;

let particleOptions = {
  friction: 0.05,
  frictionStatic: 0.1,
  render: { visible: true },
};

let defaultCategory = 0x0001, // for walls
  ballCategory = 0x0002, // red circles
  crateCategory = 0x0004; // yellow circles

let bodies = [
  Bodies.rectangle(100 + space * 0, 150, 100, 100, {
    restitution: rest,
    mass: 1,
    label: "boxLight",
    timeScale: 0.6,
    defaultTimeScale: 0.6,
    sloMo: false,
    collisionFilter: {
      category: crateCategory,
    },
    render: {
      sprite: {
        texture: "https://user-images.githubusercontent.com/623568/268296749-90d36727-f61d-436f-aa6e-97037730cfbe.jpg",
        xScale: 0.333,
        yScale: 0.333,
      },
    },
  }),

  Bodies.rectangle(100 + space * 1, 150, 75, 75, {
    restitution: rest,
    timeScale: 0.6,
    defaultTimeScale: 0.6,
    sloMo: false,
    mass: 1.5,
    label: "boxMed",
    collisionFilter: {
      category: crateCategory,
    },
    render: {
      sprite: {
        texture: "https://user-images.githubusercontent.com/623568/268296751-01556a5c-88e4-4d0e-a75a-bdfc453ff283.jpg",
        xScale: 0.3,
        yScale: 0.3,
      },
    },
  }),

  Bodies.rectangle(100 + space * 2, 150, 50, 50, {
    restitution: rest,
    mass: 5,
    label: "boxHeavy",
    timeScale: 0.6,
    sloMo: false,
    defaultTimeScale: 0.6,
    collisionFilter: {
      category: crateCategory,
    },
    render: {
      sprite: {
        texture: "https://user-images.githubusercontent.com/623568/268296755-79991d1b-c446-4364-b5ce-54652f911215.jpg",
        xScale: 0.2,
        yScale: 0.2,
      },
    },
  }),

  Bodies.circle(100 + space * 3, 150, 50, {
    restitution: rest,
    mass: 0.75,
    timeScale: 0.4,
    defaultTimeScale: 0.4,
    sloMo: false,
    frictionAir: 0.05,
    label: "circle1",
    collisionFilter: {
      category: ballCategory,
    },
    render: {
      sprite: {
        texture: "https://user-images.githubusercontent.com/623568/268296746-141a0a40-51ff-49e7-8e31-a7f4389e8f9e.png",
        xScale: 0.2,
        yScale: 0.2,
      },
    },
  }),

  Bodies.circle(100 + space * 4.5, 150, 70, {
    restitution: rest,
    mass: 0.75,
    frictionAir: 0.05,
    label: "circle2",
    timeScale: 0.4,
    defaultTimeScale: 0.4,
    sloMo: false,
    collisionFilter: {
      category: ballCategory,
    },
    render: {
      fillColor: "red",
      sprite: {
        texture: "https://user-images.githubusercontent.com/623568/268296746-141a0a40-51ff-49e7-8e31-a7f4389e8f9e.png",
        xScale: 0.28,
        yScale: 0.28,
      },
    },
  }),

  // Bodies.rectangle(100 + space * 5, 150, 180, 70, {
  //   restitution: rest,
  //   angle: -Math.PI * 0.5,
  //   frictionAir: 0.05,
  //   timeScale: 0.5,
  // }),

  // walls
  Bodies.rectangle(400, -150, 800, 250, {
    isStatic: true,
    label: "wallT",
    render: { fillStyle: "#000000" },
  }),
  Bodies.rectangle(400, 900, 800, 250, {
    isStatic: true,
    label: "wallF",
    render: { fillStyle: "#000000" },
  }),
  Bodies.rectangle(900, 400, 250, 800, {
    isStatic: true,
    label: "wallR",
    render: { fillStyle: "#000000" },
  }),
  Bodies.rectangle(-100, 400, 250, 800, {
    isStatic: true,
    label: "wallL",
    render: { fillStyle: "#000000" },
  }),
];

// add all of the bodies to the world
Composite.add(engine.world, bodies);

// run the renderer
Render.run(render);

// create runner
let runner = Runner.create();

// run the engine
Runner.run(runner, engine);

// Events.on(runner, "tick", () => {
//   console.log(Detector.collisions(detector))
// })

// add mouse control
let mouse = Mouse.create(render.canvas);

render.canvas.addEventListener("click", () => {
  let mousePosition = mouse.position;
  let vector = Matter.Vector.create(mousePosition.x, mousePosition.y);
  let collide = Matter.Query.point(bodies, vector);
  if (collide[0] !== undefined) {
    poke(collide[0], vector);
  }
});

function poke(body, vector) {
  let deltaX = body.position.x - vector.x;
  let deltaY = body.position.y - vector.y;
  let boundsX = body.position.x - body.bounds.max.x;
  let boundsY = body.position.y - body.bounds.max.y;
  let percentX = deltaX / boundsX;
  let percentY = deltaY / boundsY;
  // console.log(timeScale, forceMagnitude);
  //
  let timeScale = 1000 / 60 / engine.timing.lastDelta;
  // let forceMagnitudeX = percentX * 0.5 * body.mass * timeScale;
  // let forceMagnitudeY = percentY * 0.5 * body.mass * timeScale;
  let forceMagnitudeX = percentX * 0.5 * (body.mass / 2);
  let forceMagnitudeY = percentY * 0.5 * (body.mass / 2);
  // console.log(
  //   "x:",
  //   body.position.x,
  //   vector.x,
  //   deltaX,
  //   percentX,
  //   "y: ",
  //   body.position.y,
  //   vector.y,
  //   deltaY,
  //   percentY,
  // );
  // console.log("x:", forceMagnitudeX, "y: ", forceMagnitudeY)
  Matter.Body.applyForce(body, body.position, {
    x: -forceMagnitudeX,
    y: -forceMagnitudeY,
  });
}

// let detector = Matter.Detector.create({
//   bodies: bodies
// })

Matter.Events.on(engine, "collisionStart", function (event) {
  // We know there was a collision so fetch involved elements ...
  // let aElm = document.getElementById(event.pairs[0].bodyA.elementId);
  // let bElm = document.getElementById(event.pairs[0].bodyB.elementId);
  // Now do something with the event and elements ... your task ;-)
  // console.log(event.pairs[0]);

  let pairs = event.pairs[0];
  let aCat = pairs.bodyA.collisionFilter.category !== defaultCategory;
  let bCat = pairs.bodyB.collisionFilter.category !== defaultCategory;
  let bodyA = pairs.bodyA;
  let bodyB = pairs.bodyB;
  let inertiaMax = Math.max(bodyA.inertia, bodyB.inertia);
  let inertiaFloor = inertiaMax > 22000;
  let bodyAMomentum = Vector.mult(bodyA.velocity, bodyA.mass);
  let bodyBMomentum = Vector.mult(bodyB.velocity, bodyB.mass);
  let relativeMomentum = Vector.sub(bodyAMomentum, bodyBMomentum);
  let relativeMaxMomentum = Math.max(relativeMomentum.x, relativeMomentum.y);
  let momentumFloor = relativeMaxMomentum > 0.02;

  // console.log(aCat, bCat, 'default: ', defaultCategory, 'crate: ', crateCategory)
  // console.log(relativeMaxMomentum);
  // console.log(render.canvas.getContext("2d"));

  if (aCat && bCat && momentumFloor) {
    if (bodyA.sloMo == false && bodyB.sloMo == false) {
      bodyA.timeScale = 0.05;
      bodyB.timeScale = 0.05;
      bodyA.sloMo = true;
      bodyB.sloMo = true;
      bodyA.render.opacity = 0.5;
      bodyB.render.opacity = 0.5;

      let vectA = Vector.create(bodyA.position.x, bodyA.position.y)
      let vectB = Vector.create(bodyB.position.x, bodyB.position.y)
      let vectDiff = Vector.sub(vectA, vectB)
      let vectDiffHalf = Vector.div(vectDiff, 2)
      let vectMid = Vector.sub(vectA, vectDiffHalf)

      incrementScore(bodyA.mass);
      screenShake(bodyA.mass);

      let sloMo = setTimeout(() => {
        bodyA.timeScale = bodyA.defaultTimeScale;
        bodyB.timeScale = bodyB.defaultTimeScale;
        bodyA.render.opacity = 1;
        bodyB.render.opacity = 1;
      }, 150);

      // only slomo once every so often
      let sloMoClear = setTimeout(() => {
        bodyA.sloMo = false;
        bodyB.sloMo = false;
        clearTimer(sloMoClear);
      }, 1000);
    }
  }
});

function clearTimer(timer) {
  clearTimeout(timer);
}

function screenShake(num = 5) {
  // if num = 10
  const newNum = num * 4;
  // console.log("shake factor: ", num, newNum);
  Bounds.translate(render.bounds, { x: newNum, y: -newNum }); //x5, y-5

  setTimeout(() => {
    Bounds.translate(render.bounds, { x: -newNum * 2, y: newNum }); //x-5, y0
  }, 20);

  setTimeout(() => {
    Bounds.translate(render.bounds, { x: 0, y: newNum }); //x-5, y5
  }, 40);

  setTimeout(() => {
    Bounds.translate(render.bounds, { x: newNum * 1.5, y: newNum }); //x2.5, y10
  }, 60);

  setTimeout(() => {
    Bounds.translate(render.bounds, { x: -newNum * 0.5, y: -newNum * 2 }); //x0, y0
  }, 80);
}

function incrementScore(num) {
  collideScore = collideScore + num;
  scoreEl.innerHTML = collideScore;
}

function drawImpact(x, y, width) {
  ctx.strokeStyle = 'red';
  ctx.strokeRect(x, y, width, width);
}
