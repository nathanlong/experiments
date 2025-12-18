/**
 * Ripples plugin v0.0.2a
 * MIT License
 *
 * Based on the work of:
 * https://github.com/lolrazh/enhanced-jquery-ripples
 * https://github.com/sirxemic/jquery.ripples
 * Modified by Nathan Long, nathan-long.com
 *
 * Additions:
 * - Removed jQuery dependency
 * - Replaced image sampling with shifting color background
 * - Adjusted shaders to look better on flat colors
 * - Added start/stop rain controls as well as rain interval options
 * - Moved to class syntax
 *
 */

"use strict";

let gl;

/**
 *  Load a configuration of GL settings which the browser supports.
 *  For example:
 *  - not all browsers support WebGL
 *  - not all browsers support floating point textures
 *  - not all browsers support linear filtering for floating point textures
 *  - not all browsers support rendering to floating point textures
 *  - some browsers *do* support rendering to half-floating point textures instead.
 */
function loadConfig() {
  const canvas = document.createElement("canvas");
  gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");

  if (!gl) return null;

  // Load extensions
  const extensions = {};
  [
    "OES_texture_float",
    "OES_texture_half_float",
    "OES_texture_float_linear",
    "OES_texture_half_float_linear",
  ].forEach(function (name) {
    const extension = gl.getExtension(name);
    if (extension) extensions[name] = extension;
  });

  if (!extensions.OES_texture_float) return null;

  function createConfig(type, glType, arrayType) {
    const name = "OES_texture_" + type,
      nameLinear = name + "_linear",
      linearSupport = nameLinear in extensions;

    return {
      type: glType,
      arrayType: arrayType,
      linearSupport: linearSupport,
      extensions: linearSupport ? [name, nameLinear] : [name],
    };
  }

  let configs = [createConfig("float", gl.FLOAT, Float32Array)];

  if (extensions.OES_texture_half_float) {
    configs.push(
      createConfig(
        "half_float",
        extensions.OES_texture_half_float.HALF_FLOAT_OES,
        null
      )
    );
  }

  // Setup the texture and framebuffer
  const texture = gl.createTexture();
  const framebuffer = gl.createFramebuffer();

  gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

  // Find first supported configuration
  for (let i = 0; i < configs.length; i++) {
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      32,
      32,
      0,
      gl.RGBA,
      configs[i].type,
      null
    );
    gl.framebufferTexture2D(
      gl.FRAMEBUFFER,
      gl.COLOR_ATTACHMENT0,
      gl.TEXTURE_2D,
      texture,
      0
    );
    if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE) {
      return configs[i];
    }
  }

  return null;
}

function createProgram(vertexSource, fragmentSource, uniformValues) {
  function compileSource(type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error("Shader compile error:", gl.getShaderInfoLog(shader));
      throw new Error("compile error: " + gl.getShaderInfoLog(shader));
    }
    return shader;
  }

  const program = {};

  program.id = gl.createProgram();
  gl.attachShader(program.id, compileSource(gl.VERTEX_SHADER, vertexSource));
  gl.attachShader(
    program.id,
    compileSource(gl.FRAGMENT_SHADER, fragmentSource)
  );
  gl.linkProgram(program.id);
  if (!gl.getProgramParameter(program.id, gl.LINK_STATUS)) {
    console.error("Program link error:", gl.getProgramInfoLog(program.id));
    throw new Error("link error: " + gl.getProgramInfoLog(program.id));
  }

  // Fetch the uniform and attribute locations
  program.uniforms = {};
  program.locations = {};
  gl.useProgram(program.id);
  gl.enableVertexAttribArray(0);
  let match, name;
  const regex = /uniform (\w+) (\w+)/g;
  const shaderCode = vertexSource + fragmentSource;
  while ((match = regex.exec(shaderCode)) != null) {
    name = match[2];
    program.locations[name] = gl.getUniformLocation(program.id, name);
  }

  return program;
}

function bindTexture(texture, unit) {
  gl.activeTexture(gl.TEXTURE0 + (unit || 0));
  gl.bindTexture(gl.TEXTURE_2D, texture);
}

const config = loadConfig();

// RIPPLES CLASS DEFINITION
// =========================

class Ripples {
  static DEFAULTS = {
    imageUrl: null,
    resolution: 512,
    dropRadius: 37,
    perturbance: 0.12,
    interactive: true,
    crossOrigin: "",
    rainDropInterval: 300,
  };

  constructor(el, options) {
    const that = this;

    this.el = el;

    // Init properties from options
    this.interactive = options.interactive;
    this.resolution = options.resolution;
    this.textureDelta = new Float32Array([
      1 / this.resolution,
      1 / this.resolution,
    ]);

    // Add spring physics properties
    this.currentTilt = { x: 0, y: 0 };
    this.targetTilt = { x: 0, y: 0 };
    this.velocity = { x: 0, y: 0 };
    this.lastTime = Date.now();

    this.perturbance = options.perturbance;
    this.dropRadius = options.dropRadius;

    // Add raindrop properties
    this.lastMouseMove = Date.now();
    this.isRaining = false;
    this.rainInterval = null;
    this.rainDropInterval = options.rainDropInterval;
    this.manualRainControl = false; // Track if rain was manually controlled

    // Resize debouncing properties
    this.resizeTimeout = null;
    this.resizeDelay = 200; // 100ms debounce delay

    this.crossOrigin = options.crossOrigin;
    this.imageUrl = options.imageUrl;

    this.startTime = Date.now() / 1000;

    // Color cycling properties - two colors to cycle between
    this.colorA = new Float32Array([0.4745098039, 0.6980392157, 0.968627451]);
    this.colorB = new Float32Array([0.0519607843, 0.2649019608, 0.5298039216]);
    this.cycleSpeed = 0.15; // Speed of color cycling

    // Color oscillation transition properties
    this.currentColorA = new Float32Array([
      0.4039215686, 0.6156862745, 0.968627451,
    ]);
    this.currentColorB = new Float32Array([
      0.1019607843, 0.4549019608, 0.9098039216,
    ]);
    this.targetColorA = new Float32Array([
      0.4039215686, 0.6156862745, 0.968627451,
    ]);
    this.targetColorB = new Float32Array([
      0.1019607843, 0.4549019608, 0.9098039216,
    ]);
    this.oscillationTransitionStart = 0;
    this.oscillationTransitionDuration = 2.0; // 2 seconds for oscillation transition
    this.isOscillationTransitioning = false;

    // Add mouse position tracking
    this.mousePosition = new Float32Array([0.5, 0.5]); // Default to center

    // Init WebGL canvas
    const canvas = document.createElement("canvas");
    canvas.width = this.el.clientWidth;
    canvas.height = this.el.clientHeight;
    this.canvas = canvas;
    canvas.style.position = "absolute";
    canvas.style.left = "0";
    canvas.style.top = "0";
    canvas.style.right = "0";
    canvas.style.bottom = "0";
    canvas.style.zIndex = "-1";
    canvas.style.transformOrigin = "center center";

    this.el.classList.add("vanilla-ripples");
    this.el.appendChild(canvas);

    this.context = gl =
      canvas.getContext("webgl") || canvas.getContext("experimental-webgl");

    // Load extensions
    config.extensions.forEach(function (name) {
      gl.getExtension(name);
    });

    // Auto-resize when window size changes.
    this.updateSize = this.updateSize.bind(this);
    window.addEventListener("resize", this.updateSize);

    // Init rendertargets for ripple data.
    this.textures = [];
    this.framebuffers = [];
    this.bufferWriteIndex = 0;
    this.bufferReadIndex = 1;

    const arrayType = config.arrayType;
    const textureData = arrayType
      ? new arrayType(this.resolution * this.resolution * 4)
      : null;

    for (let i = 0; i < 2; i++) {
      const texture = gl.createTexture();
      const framebuffer = gl.createFramebuffer();

      gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);

      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texParameteri(
        gl.TEXTURE_2D,
        gl.TEXTURE_MIN_FILTER,
        config.linearSupport ? gl.LINEAR : gl.NEAREST
      );
      gl.texParameteri(
        gl.TEXTURE_2D,
        gl.TEXTURE_MAG_FILTER,
        config.linearSupport ? gl.LINEAR : gl.NEAREST
      );
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        this.resolution,
        this.resolution,
        0,
        gl.RGBA,
        config.type,
        textureData
      );

      gl.framebufferTexture2D(
        gl.FRAMEBUFFER,
        gl.COLOR_ATTACHMENT0,
        gl.TEXTURE_2D,
        texture,
        0
      );

      this.textures.push(texture);
      this.framebuffers.push(framebuffer);
    }

    // Init GL stuff
    this.quad = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.quad);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, +1, -1, +1, +1, -1, +1]),
      gl.STATIC_DRAW
    );

    this.initShaders();

    // Load the image either from the options or CSS rules
    this.loadImage();

    // Set correct clear color and blend mode (regular alpha blending)
    gl.clearColor(0, 0, 0, 0);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    // Plugin is successfully initialized!
    this.visible = true;
    this.running = true;
    this.inited = true;
    this.destroyed = false;

    this.setupPointerEvents();

    // Init animation
    function step() {
      if (!that.destroyed) {
        that.step();

        requestAnimationFrame(step);
      }
    }

    requestAnimationFrame(step);
  }

  // Set up pointer (mouse + touch) events
  setupPointerEvents() {
    const that = this;
    let time = 0;

    function pointerEventsEnabled() {
      return that.visible && that.running && that.interactive;
    }

    function dropAtPointer(pointer, big) {
      if (pointerEventsEnabled()) {
        that.dropAtPointer(
          pointer,
          that.dropRadius * (big ? 1.5 : 1),
          big ? 0.14 : 0.01
        );
      }
    }

    // Start listening to pointer events
    this.pointerMoveHandler = function (e) {
      dropAtPointer(e);
    };

    this.touchHandler = function (e) {
      const touches = e.changedTouches;
      for (let i = 0; i < touches.length; i++) {
        dropAtPointer(touches[i]);
      }
    };

    this.mouseDownHandler = function (e) {
      dropAtPointer(e, true);
    };

    this.handleRipple = function (e) {
      time += 0.05;
      const currentRadius = 20 + Math.sin(time * 4);
      const strength = e.type === "mousedown" ? 0.005 : 0.0008;

      that.dropAtPointer(e, currentRadius, strength);
    };

    // Only attach event listeners if interactive is true
    if (this.interactive) {
      window.addEventListener("mousemove", this.handleRipple);
      window.addEventListener("touchmove", this.touchHandler);
      window.addEventListener("touchstart", this.touchHandler);
      window.addEventListener("mousedown", this.handleRipple);
    }
  }

  // Load the image either from the options or the element's CSS rules.
  loadImage() {
    // Remove all the image loading logic - we don't need it anymore
    this.backgroundWidth = this.canvas.width;
    this.backgroundHeight = this.canvas.height;
  }

  step() {
    gl = this.context;

    if (!this.visible) {
      return;
    }

    this.computeTextureBoundaries();

    if (this.running) {
      this.update();

      // Check if we should start rain
      if (
        !this.manualRainControl &&
        !this.isRaining &&
        Date.now() - this.lastMouseMove > 1000
      ) {
        this.startRain();
      }
    }

    this.render();
  }

  drawQuad() {
    gl.bindBuffer(gl.ARRAY_BUFFER, this.quad);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
  }

  render() {
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    gl.viewport(0, 0, this.canvas.width, this.canvas.height);

    gl.enable(gl.BLEND);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.useProgram(this.renderProgram.id);

    // Only bind the ripples texture now
    bindTexture(this.textures[0], 0);

    gl.uniform1f(this.renderProgram.locations.perturbance, this.perturbance);
    gl.uniform2fv(
      this.renderProgram.locations.containerRatio,
      this.renderProgram.uniforms.containerRatio
    );
    gl.uniform1i(this.renderProgram.locations.samplerRipples, 0);
    gl.uniform2fv(this.renderProgram.locations.u_mouse, this.mousePosition);
    gl.uniform2fv(
      this.renderProgram.locations.textureSize,
      new Float32Array([this.canvas.width, this.canvas.height])
    );

    // Add time and color uniforms
    const currentTime = Date.now() / 1000;
    const elapsedTime = currentTime - this.startTime;

    // Handle oscillation color transitions
    if (this.isOscillationTransitioning) {
      const transitionTime = currentTime - this.oscillationTransitionStart;
      const progress = Math.min(
        transitionTime / this.oscillationTransitionDuration,
        1.0
      );

      // Smooth easing function (ease-out)
      const easedProgress = 1 - Math.pow(1 - progress, 3);

      // Interpolate colorA
      for (let i = 0; i < 3; i++) {
        this.currentColorA[i] =
          this.colorA[i] +
          (this.targetColorA[i] - this.colorA[i]) * easedProgress;
      }

      // Interpolate colorB
      for (let i = 0; i < 3; i++) {
        this.currentColorB[i] =
          this.colorB[i] +
          (this.targetColorB[i] - this.colorB[i]) * easedProgress;
      }

      // Check if transition is complete
      if (progress >= 1.0) {
        // Update the base colors to the target colors
        for (let i = 0; i < 3; i++) {
          this.colorA[i] = this.targetColorA[i];
          this.colorB[i] = this.targetColorB[i];
        }
        this.isOscillationTransitioning = false;
      }
    } else {
      // Use the base colors when not transitioning
      for (let i = 0; i < 3; i++) {
        this.currentColorA[i] = this.colorA[i];
        this.currentColorB[i] = this.colorB[i];
      }
    }

    gl.uniform1f(this.renderProgram.locations.time, elapsedTime);
    gl.uniform3fv(this.renderProgram.locations.colorA, this.currentColorA);
    gl.uniform3fv(this.renderProgram.locations.colorB, this.currentColorB);
    gl.uniform1f(this.renderProgram.locations.cycleSpeed, this.cycleSpeed);

    this.drawQuad();
    gl.disable(gl.BLEND);
  }

  update() {
    gl.viewport(0, 0, this.resolution, this.resolution);

    gl.bindFramebuffer(
      gl.FRAMEBUFFER,
      this.framebuffers[this.bufferWriteIndex]
    );
    bindTexture(this.textures[this.bufferReadIndex]);
    gl.useProgram(this.updateProgram.id);

    this.drawQuad();

    this.swapBufferIndices();
  }

  swapBufferIndices() {
    this.bufferWriteIndex = 1 - this.bufferWriteIndex;
    this.bufferReadIndex = 1 - this.bufferReadIndex;
  }

  computeTextureBoundaries() {
    const maxSide = Math.max(this.canvas.width, this.canvas.height);

    this.renderProgram.uniforms.containerRatio = new Float32Array([
      this.canvas.width / maxSide,
      this.canvas.height / maxSide,
    ]);
  }

  initShaders() {
    const vertexShader = [
      "attribute vec2 vertex;",
      "varying vec2 coord;",
      "void main() {",
      "coord = vertex * 0.5 + 0.5;",
      "gl_Position = vec4(vertex, 0.0, 1.0);",
      "}",
    ].join("\n");

    this.dropProgram = createProgram(
      vertexShader,
      [
        "precision highp float;",

        "const float PI = 3.141592653589793;",
        "uniform sampler2D texture;",
        "uniform vec2 center;",
        "uniform float radius;",
        "uniform float strength;",

        "varying vec2 coord;",

        "void main() {",
        "vec4 info = texture2D(texture, coord);",

        "float drop = max(0.0, 1.0 - length(center * 0.5 + 0.5 - coord) / radius);",
        "drop = pow(drop, 1.5);",
        "drop = 0.5 - cos(drop * PI) * 0.5;",

        "info.r += drop * strength;",

        "gl_FragColor = info;",
        "}",
      ].join("\n")
    );

    this.updateProgram = createProgram(
      vertexShader,
      [
        "precision highp float;",

        "uniform sampler2D texture;",
        "uniform vec2 delta;",

        "varying vec2 coord;",

        "void main() {",
        "vec4 info = texture2D(texture, coord);",

        "vec2 dx = vec2(delta.x, 0.0);",
        "vec2 dy = vec2(0.0, delta.y);",

        "float average = (",
        "texture2D(texture, coord - dx).r +",
        "texture2D(texture, coord - dy).r +",
        "texture2D(texture, coord + dx).r +",
        "texture2D(texture, coord + dy).r",
        ") * 0.25;",

        "info.g += (average - info.r) * 1.8;",
        "info.g *= 0.996;", // Reduced damping for longer ripple lifespan
        "info.r += info.g;",
        "info.r *= 0.985;", // Less height reduction for farther travel

        "gl_FragColor = info;",
        "}",
      ].join("\n")
    );
    gl.uniform2fv(this.updateProgram.locations.delta, this.textureDelta);

    this.renderProgram = createProgram(
      [
        "precision highp float;",

        "attribute vec2 vertex;",
        "uniform vec2 containerRatio;",
        "varying vec2 ripplesCoord;",
        "varying vec2 screenCoord;", // For procedural color generation
        "void main() {",
        "screenCoord = vertex * 0.5 + 0.5;",
        "ripplesCoord = vec2(vertex.x, -vertex.y) * containerRatio * 0.5 + 0.5;",
        "gl_Position = vec4(vertex.x, -vertex.y, 0.0, 1.0);",
        "}",
      ].join("\n"),
      [
        "precision highp float;",

        "uniform sampler2D samplerRipples;",
        "uniform vec2 delta;",
        "uniform float perturbance;",
        "uniform float lightElevation;",
        "uniform float time;",
        "uniform vec3 colorA;", // First color for cycling
        "uniform vec3 colorB;", // Second color for cycling
        "uniform float cycleSpeed;", // Speed of color cycling
        "uniform vec2 u_mouse;",
        "uniform vec2 textureSize;",

        "varying vec2 ripplesCoord;",
        "varying vec2 screenCoord;",

        "const float PI = 3.141592653589793;",

        "vec3 getLightDir() {",
        "float elevationRad = lightElevation * 3.14159 / 180.0;",
        "return normalize(vec3(0.8, -2.4, tan(elevationRad)));",
        "}",

        "void main() {",
        // Sample ripple height map
        "float height = texture2D(samplerRipples, ripplesCoord).r;",

        // Calculate normals for lighting
        "float heightX1 = texture2D(samplerRipples, vec2(ripplesCoord.x + delta.x, ripplesCoord.y)).r;",
        "float heightX2 = texture2D(samplerRipples, vec2(ripplesCoord.x - delta.x, ripplesCoord.y)).r;",
        "float heightY1 = texture2D(samplerRipples, vec2(ripplesCoord.x, ripplesCoord.y + delta.y)).r;",
        "float heightY2 = texture2D(samplerRipples, vec2(ripplesCoord.x, ripplesCoord.y - delta.y)).r;",

        "float gradX = ((heightX1 - height) + (height - heightX2)) * 0.5;",
        "float gradY = ((heightY1 - height) + (height - heightY2)) * 0.5;",

        // Calculate surface normal
        "vec3 dx = vec3(delta.x * 2.0, gradX * 1.2, 0.0);",
        "vec3 dy = vec3(0.0, gradY * 1.2, delta.y * 2.0);",
        "vec3 normal = normalize(cross(dx, dy));",

        // Calculate distortion offset for more visible ripples
        "vec2 distortionOffset = normal.xz * perturbance * 2.5;",
        "vec2 colorDistortionOffset = normal.xz * perturbance * 0.8;", // Gentler distortion for color
        "vec2 distortedCoord = screenCoord + colorDistortionOffset;",

        // Generate procedural background color with distortion
        // Two-color cycling animation
        "float cycleTime = time * cycleSpeed;",
        "float colorMix = (sin(cycleTime) + 1.0) * 0.5;", // Oscillate between 0 and 1
        "float spatialVariation = sin(length(distortedCoord) * 1.5 + cycleTime) * 0.1 + 0.9;", // Subtle spatial variation
        "vec3 interpolatedColor = mix(colorA, colorB, colorMix);",
        "vec4 proceduralColor = vec4(interpolatedColor * spatialVariation, 1.0);",

        // Enhanced lighting calculation
        "vec3 lightDir = getLightDir();",
        "float diffuse = max(0.0, dot(normal, lightDir)) * 0.6;",

        // Enhanced specular highlights for more visible ripples
        "vec2 viewDir = normalize(vec2(-0.6, 1.0));",
        "float roughness = 0.04;", // Reduced for sharper highlights
        "vec3 halfwayDir = normalize(vec3(viewDir.x, 1.0, viewDir.y) + lightDir);",
        "float NdotH = max(dot(normal, halfwayDir), 0.0);",
        "float D = (roughness * roughness) / max(PI * pow(NdotH * NdotH * (roughness * roughness - 1.0) + 1.0, 2.0), 0.001);",
        "float specular = D * 3.5;", // Further increased specular intensity for maximum brightness

        // Sample neighboring specular values for smoother blending
        "float neighborScale = 0.3;",
        "vec2 offset1 = vec2(delta.x * neighborScale, 0.0);",
        "vec2 offset2 = vec2(0.0, delta.y * neighborScale);",
        "vec2 offset3 = vec2(delta.x * neighborScale, delta.y * neighborScale);",
        "vec2 offset4 = vec2(-delta.x * neighborScale, delta.y * neighborScale);",

        "float neighbor1 = texture2D(samplerRipples, ripplesCoord + offset1).r;",
        "float neighbor2 = texture2D(samplerRipples, ripplesCoord + offset2).r;",
        "float neighbor3 = texture2D(samplerRipples, ripplesCoord + offset3).r;",
        "float neighbor4 = texture2D(samplerRipples, ripplesCoord + offset4).r;",

        // Calculate average height for smoother specular blending
        "float avgHeight = (height + neighbor1 + neighbor2 + neighbor3 + neighbor4) * 0.2;",
        "float heightVariation = abs(height - avgHeight);",
        "float blendFactor = smoothstep(0.0, 0.02, heightVariation);",

        // Pure white specular with smooth blending
        "vec3 pureWhite = vec3(1.0);", // Pure white
        "float smoothedSpecular = mix(specular * 1.2, specular * 1.8, blendFactor);", // Maximum specular enhancement
        "vec3 specularColor = pureWhite * smoothedSpecular;",

        // Add Fresnel effect for more realistic water
        "float viewAngle = max(0.0, dot(normal, vec3(0.0, 1.0, 0.0)));",
        "float fresnel = pow(1.0 - viewAngle, 3.0);",
        "float fresnelIntensity = 1.2 + fresnel * 0.8;", // Maximum fresnel for brightest edges
        "specularColor *= fresnelIntensity;",

        // Add subtle caustic-like effect (reduced intensity)
        "float caustic = sin(length(distortedCoord) * 15.0 + time) * 0.5 + 0.5;",
        "caustic = smoothstep(0.2, 0.8, caustic) * 0.18;", // Maximum caustic intensity
        "vec3 whiteCaustics = vec3(1.0) * caustic * specular * 1.6;", // Maximum white caustic highlights

        // Add additional edge-based highlighting for maximum visibility
        "float edgeDetection = length(vec2(gradX, gradY));",
        "float edgeHighlight = smoothstep(0.01, 0.05, edgeDetection) * 0.4;",
        "vec3 additionalHighlights = vec3(1.0) * edgeHighlight * specular;",

        // Combine lighting with base color
        "vec4 finalColor = proceduralColor;",

        // Add white diffuse component for more realistic water lighting
        "vec3 whiteDiffuse = vec3(1.0) * diffuse * 0.3;", // Increased white diffuse light
        "finalColor.rgb = mix(finalColor.rgb, finalColor.rgb * (1.0 + diffuse), 0.9);",
        "finalColor.rgb += whiteDiffuse;", // Add white light component
        "finalColor.rgb += whiteCaustics;", // Add white caustic highlights
        "finalColor.rgb += additionalHighlights;", // Add edge-based highlights

        // Attempts to add brighter highlights using ripple strength
        "float amplifiedHeight = abs(height * 100.0);",
        "float highlightStrength = smoothstep(0.005, 0.08, amplifiedHeight);", // Smooth gradient from edges to peaks
        "vec3 brightenedColor = finalColor.rgb * (1.0 + highlightStrength * 0.4);", // More subtle brightening
        "finalColor.rgb = mix(finalColor.rgb, brightenedColor, highlightStrength * 0.3);", // Gentler blending

        // Add subtle rim lighting for depth
        "float rim = 1.0 - viewAngle;",
        "finalColor.rgb += vec3(0.2) * rim * rim * specular;", // Maximum rim lighting intensity

        "finalColor.a = 1.0;",

        "gl_FragColor = finalColor;",
        "}",
      ].join("\n")
    );
    gl.uniform2fv(this.renderProgram.locations.delta, this.textureDelta);
    gl.uniform1f(this.renderProgram.locations.lightElevation, 65.0);
  }

  dropAtPointer(pointer, radius, strength) {
    const borderOffset = {
      left: parseInt(getComputedStyle(this.el).borderLeftWidth) || 0,
      top: parseInt(getComputedStyle(this.el).borderTopWidth) || 0,
    };

    const elementRect = this.el.getBoundingClientRect();
    this.drop(
      pointer.pageX -
        (elementRect.left + window.pageXOffset) -
        borderOffset.left,
      pointer.pageY - (elementRect.top + window.pageYOffset) - borderOffset.top,
      radius,
      strength
    );
  }

  /**
   *  Public methods
   */
  drop(x, y, radius, strength) {
    gl = this.context;

    const elWidth = this.el.clientWidth;
    const elHeight = this.el.clientHeight;
    const longestSide = Math.max(elWidth, elHeight);

    const dropPosition = new Float32Array([
      (2 * x - elWidth) / longestSide,
      (elHeight - 2 * y) / longestSide,
    ]);

    gl.viewport(0, 0, this.resolution, this.resolution);
    gl.bindFramebuffer(
      gl.FRAMEBUFFER,
      this.framebuffers[this.bufferWriteIndex]
    );
    bindTexture(this.textures[this.bufferReadIndex]);
    gl.useProgram(this.dropProgram.id);

    gl.uniform2fv(this.dropProgram.locations.center, dropPosition);
    gl.uniform1f(this.dropProgram.locations.radius, radius / longestSide);
    gl.uniform1f(this.dropProgram.locations.strength, strength);

    this.drawQuad();
    this.swapBufferIndices();
  }

  updateSize() {
    const that = this;

    // Clear any existing timeout
    if (this.resizeTimeout) {
      clearTimeout(this.resizeTimeout);
    }

    // Debounce the resize operation
    this.resizeTimeout = setTimeout(function () {
      const newWidth = that.el.clientWidth;
      const newHeight = that.el.clientHeight;

      // Only resize if dimensions actually changed
      if (newWidth !== that.canvas.width || newHeight !== that.canvas.height) {
        // Update canvas dimensions
        that.canvas.width = newWidth;
        that.canvas.height = newHeight;

        // Update WebGL viewport
        gl = that.context;
        gl.viewport(0, 0, newWidth, newHeight);

        // Update background dimensions for procedural color calculations
        that.backgroundWidth = newWidth;
        that.backgroundHeight = newHeight;

        // Recompute texture boundaries with new dimensions
        that.computeTextureBoundaries();
      }

      that.resizeTimeout = null;
    }, this.resizeDelay);
  }

  destroy() {
    this.stopRain(); // Clean up rain interval

    // Clean up resize timeout
    if (this.resizeTimeout) {
      clearTimeout(this.resizeTimeout);
      this.resizeTimeout = null;
    }

    // Remove event listeners
    if (this.interactive) {
      window.removeEventListener("mousemove", this.handleRipple);
      window.removeEventListener("touchmove", this.touchHandler);
      window.removeEventListener("touchstart", this.touchHandler);
      window.removeEventListener("mousedown", this.handleRipple);
    }

    this.el.classList.remove("vanilla-ripples");
    this.el.style.position = "";

    gl = null;

    window.removeEventListener("resize", this.updateSize);

    this.destroyed = true;
  }

  show() {
    this.visible = true;

    this.canvas.style.display = "";
  }

  hide() {
    this.visible = false;

    this.canvas.style.display = "none";
  }

  pause() {
    this.running = false;
  }

  play() {
    this.running = true;
  }

  set(property, value) {
    switch (property) {
      case "dropRadius":
      case "perturbance":
      case "crossOrigin":
        this[property] = value;
        break;
      case "interactive":
        // Handle interactive toggle dynamically
        const wasInteractive = this.interactive;
        this.interactive = value;

        if (wasInteractive && !value) {
          // Remove event listeners
          window.removeEventListener("mousemove", this.handleRipple);
          window.removeEventListener("touchmove", this.touchHandler);
          window.removeEventListener("touchstart", this.touchHandler);
          window.removeEventListener("mousedown", this.handleRipple);
        } else if (!wasInteractive && value) {
          // Add event listeners
          window.addEventListener("mousemove", this.handleRipple);
          window.addEventListener("touchmove", this.touchHandler);
          window.addEventListener("touchstart", this.touchHandler);
          window.addEventListener("mousedown", this.handleRipple);
        }
        break;
      case "oscillationColors":
        if (Array.isArray(value) && value.length === 2) {
          const [colorA, colorB] = value;
          if (
            Array.isArray(colorA) &&
            colorA.length >= 3 &&
            Array.isArray(colorB) &&
            colorB.length >= 3
          ) {
            // If already transitioning, start from current interpolated values
            if (this.isOscillationTransitioning) {
              this.colorA[0] = this.currentColorA[0];
              this.colorA[1] = this.currentColorA[1];
              this.colorA[2] = this.currentColorA[2];
              this.colorB[0] = this.currentColorB[0];
              this.colorB[1] = this.currentColorB[1];
              this.colorB[2] = this.currentColorB[2];
            }
            this.targetColorA = new Float32Array([
              colorA[0],
              colorA[1],
              colorA[2],
            ]);
            this.targetColorB = new Float32Array([
              colorB[0],
              colorB[1],
              colorB[2],
            ]);
            this.oscillationTransitionStart = Date.now() / 1000;
            this.isOscillationTransitioning = true;
          }
        }
        break;
      case "oscillationTransitionDuration":
        if (typeof value === "number" && value > 0) {
          this.oscillationTransitionDuration = value;
        }
        break;
      case "cycleSpeed":
        if (typeof value === "number") {
          this.cycleSpeed = value;
        }
        break;
      case "startRain":
        this.manualRainControl = true;
        this.startRain();
        break;
      case "stopRain":
        this.manualRainControl = true;
        this.stopRain();
        break;
      case "rainDropInterval":
        if (typeof value === "number" && value > 0) {
          this.rainDropInterval = value;
          // If rain is currently running, restart it with new interval
          if (this.isRaining) {
            this.manualRainControl = true;
            this.stopRain();
            this.startRain();
          }
        }
        break;
      case "imageUrl":
        this.imageUrl = value;
        this.loadImage();
        break;
    }
  }

  startRain() {
    if (this.isRaining) return;

    const that = this;
    this.isRaining = true;

    this.rainInterval = setInterval(function () {
      const x = Math.random() * that.el.clientWidth;
      const y = Math.random() * that.el.clientHeight;
      that.drop(x, y, that.dropRadius * 0.4, 0.008);
    }, this.rainDropInterval);
  }

  stopRain() {
    this.isRaining = false;
    if (this.rainInterval) {
      clearInterval(this.rainInterval);
      this.rainInterval = null;
    }
  }
}

// VANILLA RIPPLES API
// ===================

// Helper function to extend objects
function extend(target) {
  for (let i = 1; i < arguments.length; i++) {
    const source = arguments[i];
    for (const key in source) {
      if (source.hasOwnProperty(key)) {
        target[key] = source[key];
      }
    }
  }
  return target;
}

// Main API function
function ripples(elements, option) {
  if (!config) {
    throw new Error(
      "Your browser does not support WebGL, the OES_texture_float extension or rendering to floating point textures."
    );
  }

  // Handle different element input types
  if (typeof elements === "string") {
    elements = document.querySelectorAll(elements);
  } else if (elements.nodeType) {
    elements = [elements];
  }

  const args =
    arguments.length > 2 ? Array.prototype.slice.call(arguments, 2) : undefined;

  for (let i = 0; i < elements.length; i++) {
    const element = elements[i];
    let data = element._ripplesInstance;
    const options = extend(
      {},
      Ripples.DEFAULTS,
      typeof option === "object" && option
    );

    if (!data && typeof option === "string") {
      continue;
    }
    if (!data) {
      element._ripplesInstance = data = new Ripples(element, options);
    } else if (typeof option === "string") {
      Ripples.prototype[option].apply(data, args);
    }
  }

  return elements;
}

// Simple ES6 default export
export default ripples;
