import"../modulepreload-polyfill-B5Qt9EMX.js";const M=8,fo="#0a0a1a",go=["#3b82f6","#8b5cf6","#06b6d4","#ec4899"];function mo(o){const e=o.replace("#",""),n=parseInt(e.slice(0,2),16)/255,t=parseInt(e.slice(2,4),16)/255,f=parseInt(e.slice(4,6),16)/255;return[U(n),U(t),U(f)]}function U(o){return o<=.04045?o/12.92:Math.pow((o+.055)/1.055,2.4)}function bo(o,e,n){const t=.4122214708*o+.5363325363*e+.0514459929*n,f=.2119034982*o+.6806995451*e+.1073969566*n,m=.0883024619*o+.2817188376*e+.6299787005*n,b=Math.cbrt(t),d=Math.cbrt(f),g=Math.cbrt(m);return[.2104542553*b+.793617785*d-.0040720468*g,1.9779984951*b-2.428592205*d+.4505937099*g,.0259040371*b+.7827717662*d-.808675766*g]}function ho(o,e,n){const t=o+.3963377774*e+.2158037573*n,f=o-.1055613458*e-.0638541728*n,m=o-.0894841775*e-1.291485548*n,b=t*t*t,d=f*f*f,g=m*m*m;return[4.0767416621*b-3.3077115913*d+.2309699292*g,-1.2684380046*b+2.6097574011*d-.3413193965*g,-.0041960863*b-.7034186147*d+1.707614701*g]}function P(o){const[e,n,t]=mo(o);return bo(e,n,t)}function Q(o,e,n){const[t,f,m]=ho(o,e,n);return[Math.max(0,t),Math.max(0,f),Math.max(0,m)]}function T(o,e,n){return o+(e-o)*n}function So(o){return o<.5?4*o**3:1-(-2*o+2)**3/2}function Co(o){return Array.from({length:o},(e,n)=>({cx:Math.random(),cy:Math.random(),rx:n===0?.4+Math.random()*.2:.08+Math.random()*.28,ry:n===0?.4+Math.random()*.2:.08+Math.random()*.28,speed:(.04+Math.random()*.12)*(Math.random()<.5?1:-1),phase:Math.random()*Math.PI*2,scale:n===0?1.5:.8+Math.random()*.5}))}function Z(o,e,n){const t=o.createShader(e);if(o.shaderSource(t,n),o.compileShader(t),!o.getShaderParameter(t,o.COMPILE_STATUS))throw new Error(o.getShaderInfoLog(t)??"Shader compile error");return t}function vo(o,e,n){const t=o.createProgram();if(o.attachShader(t,e),o.attachShader(t,n),o.linkProgram(t),!o.getProgramParameter(t,o.LINK_STATUS))throw new Error(o.getProgramInfoLog(t)??"Program link error");return t}const To=`#version 300 es
void main() {
  vec2 pos[3];
  pos[0] = vec2(-1.0, -1.0);
  pos[1] = vec2( 3.0, -1.0);
  pos[2] = vec2(-1.0,  3.0);
  gl_Position = vec4(pos[gl_VertexID], 0.0, 1.0);
}`,po=`#version 300 es
precision mediump float;
#define MAX_ORBITS 8

uniform int   uCount;
uniform vec2  uPositions[MAX_ORBITS];
uniform vec3  uColors[MAX_ORBITS];
uniform vec3  uBgColor;
uniform float uSigma;
uniform float uScale[MAX_ORBITS];

out vec4 fragColor;

float linearToSrgbChannel(float v) {
  return v <= 0.0031308 ? v * 12.92 : 1.055 * pow(v, 1.0 / 2.4) - 0.055;
}

vec3 linearToSrgb(vec3 c) {
  return vec3(linearToSrgbChannel(c.r), linearToSrgbChannel(c.g), linearToSrgbChannel(c.b));
}

void main() {
  vec2 fragCoord = gl_FragCoord.xy;
  float totalWeight = 0.0;
  vec3  blended = vec3(0.0);

  for (int i = 0; i < MAX_ORBITS; i++) {
    if (i >= uCount) break;
    vec2 d = fragCoord - uPositions[i];
    float s = uSigma * uScale[i];
    float w = exp(-dot(d, d) / (2.0 * s * s));
    blended     += w * uColors[i];
    totalWeight += w;
  }

  vec3 color = (blended + uBgColor) / (totalWeight + 1.0);
  fragColor = vec4(linearToSrgb(color), 1.0);
}`,Ao=`#version 300 es
precision mediump float;
#define MAX_ORBITS 8

uniform int   uCount;
uniform vec2  uPositions[MAX_ORBITS];
uniform vec3  uColors[MAX_ORBITS];
uniform vec3  uBgColor;
uniform float uSigma;
uniform float uScale[MAX_ORBITS];

out vec4 fragColor;

float linearToSrgbChannel(float v) {
  return v <= 0.0031308 ? v * 12.92 : 1.055 * pow(v, 1.0 / 2.4) - 0.055;
}

vec3 linearToSrgb(vec3 c) {
  return vec3(linearToSrgbChannel(c.r), linearToSrgbChannel(c.g), linearToSrgbChannel(c.b));
}

void main() {
  vec2 fragCoord = gl_FragCoord.xy;
  vec3 color = uBgColor;

  for (int i = 0; i < MAX_ORBITS; i++) {
    if (i >= uCount) break;
    float r = uSigma * uScale[i];
    float dist = length(fragCoord - uPositions[i]);
    if (dist < r) color = uColors[i];
  }

  fragColor = vec4(linearToSrgb(color), 1.0);
}`,Bo=`
attribute vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }`,Mo=`
precision mediump float;
#define MAX_ORBITS 8

uniform int   uCount;
uniform vec2  uPositions[MAX_ORBITS];
uniform vec3  uColors[MAX_ORBITS];
uniform vec3  uBgColor;
uniform float uSigma;
uniform float uScale[MAX_ORBITS];

float linearToSrgbChannel(float v) {
  return v <= 0.0031308 ? v * 12.92 : 1.055 * pow(v, 1.0 / 2.4) - 0.055;
}

vec3 linearToSrgb(vec3 c) {
  return vec3(linearToSrgbChannel(c.r), linearToSrgbChannel(c.g), linearToSrgbChannel(c.b));
}

void main() {
  vec2 fragCoord = gl_FragCoord.xy;
  float totalWeight = 0.0;
  vec3  blended = vec3(0.0);

  for (int i = 0; i < MAX_ORBITS; i++) {
    if (i >= uCount) break;
    vec2 d = fragCoord - uPositions[i];
    float s = uSigma * uScale[i];
    float w = exp(-dot(d, d) / (2.0 * s * s));
    blended     += w * uColors[i];
    totalWeight += w;
  }

  vec3 color = (blended + uBgColor) / (totalWeight + 1.0);
  gl_FragColor = vec4(linearToSrgb(color), 1.0);
}`,_o=`
precision mediump float;
#define MAX_ORBITS 8

uniform int   uCount;
uniform vec2  uPositions[MAX_ORBITS];
uniform vec3  uColors[MAX_ORBITS];
uniform vec3  uBgColor;
uniform float uSigma;
uniform float uScale[MAX_ORBITS];

float linearToSrgbChannel(float v) {
  return v <= 0.0031308 ? v * 12.92 : 1.055 * pow(v, 1.0 / 2.4) - 0.055;
}

vec3 linearToSrgb(vec3 c) {
  return vec3(linearToSrgbChannel(c.r), linearToSrgbChannel(c.g), linearToSrgbChannel(c.b));
}

void main() {
  vec2 fragCoord = gl_FragCoord.xy;
  vec3 color = uBgColor;

  for (int i = 0; i < MAX_ORBITS; i++) {
    if (i >= uCount) break;
    float r = uSigma * uScale[i];
    float dist = length(fragCoord - uPositions[i]);
    if (dist < r) color = uColors[i];
  }

  gl_FragColor = vec4(linearToSrgb(color), 1.0);
}`;function wo(o,e={}){const n=e.bg??fo,t=e.colors??go,f=e.resolution??.5,m=e.debug??!1,b=new AbortController,d=window.matchMedia("(prefers-reduced-motion: reduce)").matches,g=o.getContext("webgl2"),oo=g?null:o.getContext("webgl"),r=g??oo;if(!r)return{tween(){},destroy(){}};const x=!!g,G=Z(r,r.VERTEX_SHADER,x?To:Bo),eo=x?m?Ao:po:m?_o:Mo,W=Z(r,r.FRAGMENT_SHADER,eo),S=vo(r,G,W);r.useProgram(S);let _=null;if(!x){_=r.createBuffer(),r.bindBuffer(r.ARRAY_BUFFER,_),r.bufferData(r.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),r.STATIC_DRAW);const i=r.getAttribLocation(S,"aPos");r.enableVertexAttribArray(i),r.vertexAttribPointer(i,2,r.FLOAT,!1,0,0)}const to=r.getUniformLocation(S,"uCount"),ro=r.getUniformLocation(S,"uPositions"),no=r.getUniformLocation(S,"uColors"),io=r.getUniformLocation(S,"uBgColor"),ao=r.getUniformLocation(S,"uSigma"),co=r.getUniformLocation(S,"uScale"),v=Math.min(t.length,M),q=Co(v),V=new Float32Array(M).fill(1);for(let i=0;i<v;i++)V[i]=q[i].scale;r.uniform1fv(co,V);const w=new Float32Array(M*3),R=new Float32Array(3);let p=t.slice(0,v).map(P),I=P(n);const F=new Float32Array(M*2);L();let c=null,N=0,C=null,z=!document.hidden,H=!0;function L(){const[i,s,l]=Q(...I);R[0]=i,R[1]=s,R[2]=l;for(let a=0;a<v;a++){const[h,u,B]=Q(...p[a]);w[a*3]=h,w[a*3+1]=u,w[a*3+2]=B}}function Y(){const i=f*(devicePixelRatio||1),s=o.getBoundingClientRect();o.width=Math.max(1,Math.round(s.width*i)),o.height=Math.max(1,Math.round(s.height*i)),r.viewport(0,0,o.width,o.height),N=.35*Math.min(o.width,o.height),E()||A(performance.now())}let X=!1;const j=new ResizeObserver(()=>{X||(X=!0,requestAnimationFrame(()=>{X=!1,Y()}))});j.observe(o),Y();function lo(i){if(!c)return;const s=(i-c.startTime)/c.duration,l=s>=1,a=So(Math.min(s,1));I=[T(c.startBg[0],c.targetBg[0],a),T(c.startBg[1],c.targetBg[1],a),T(c.startBg[2],c.targetBg[2],a)];for(let h=0;h<c.count;h++){const u=c.startColors[h],B=c.targetColors[h];p[h]=[T(u[0],B[0],a),T(u[1],B[1],a),T(u[2],B[2],a)]}L(),l&&(c=null)}function A(i){lo(i);const s=i/1e3;for(let l=0;l<v;l++){const a=q[l];F[l*2]=(a.cx+a.rx*Math.cos(s*a.speed+a.phase))*o.width,F[l*2+1]=(a.cy+a.ry*Math.sin(s*a.speed+a.phase))*o.height}r.uniform1i(to,v),r.uniform2fv(ro,F),r.uniform3fv(no,w),r.uniform3fv(io,R),r.uniform1f(ao,N),r.drawArrays(r.TRIANGLES,0,3),E()?C=requestAnimationFrame(A):C=null}function E(){return!d&&z&&H}function O(){E()?C===null&&(C=requestAnimationFrame(A)):C!==null&&(cancelAnimationFrame(C),C=null)}document.addEventListener("visibilitychange",()=>{z=!document.hidden,O()},{signal:b.signal});const J=new IntersectionObserver(([i])=>{H=i.isIntersecting,O()});J.observe(o),d?A(performance.now()):O();function so(i,s=1500){const l=i.colors.slice(0,M).map(P),a=P(i.bg),h=Math.min(p.length,l.length);if(d){I=[...a];for(let u=0;u<h;u++)p[u]=[...l[u]];L(),A(performance.now());return}c={startColors:p.map(u=>[...u]),targetColors:l,startBg:[...I],targetBg:a,count:h,startTime:performance.now(),duration:s},O()}let K=!1;function uo(){var i;K||(K=!0,b.abort(),C!==null&&cancelAnimationFrame(C),J.disconnect(),j.disconnect(),r.deleteProgram(S),r.deleteShader(G),r.deleteShader(W),_&&r.deleteBuffer(_),(i=r.getExtension("WEBGL_lose_context"))==null||i.loseContext())}return{tween:so,destroy:uo}}function Ro(o=document){const e=new Map,n=o.querySelectorAll('canvas[data-component="canvas-gradient"]');for(const t of n)e.set(t,wo(t,Io(t)));return Object.defineProperty(e,"destroy",{value:()=>e.forEach(t=>t.destroy())}),e}function Io(o){const e={};o.dataset.bg&&(e.bg=o.dataset.bg),o.dataset.resolution&&(e.resolution=Number(o.dataset.resolution)),o.dataset.debug!=null&&(e.debug=o.dataset.debug!=="false");const n=o.dataset.colors;if(n)try{const t=JSON.parse(n.replace(/'/g,'"'));Array.isArray(t)&&(e.colors=t.map(String))}catch{e.colors=n.split(",").map(t=>t.trim()).filter(Boolean)}return e}const Oo=Ro(),k=document.querySelector('[data-component="gradient-tween"]'),D=Oo.values().next().value,Po=["#0a0a1a","#cdb4db","#000814","#386641","#f4f1de","#edede9","#05668d"],$=[["#3b82f6","#8b5cf6","#06b6d4","#ec4899"],["#ffc8dd","#ffafcc","#bde0fe","#a2d2ff"],["#001d3d","#003566","#ffc300","#ffd60a"],["#6a994e","#a7c957","#f2e8cf","#bc4749"],["#e07a5f","#3d405b","#81b29a","#f2cc8f"],["#d6ccc2","#f5ebe0","#e3d5ca","#d5bdaf"],["#028090","#00a896","#02c39a","#f0f3bd"]];let y=1;k==null||k.addEventListener("click",()=>{D==null||D.tween({bg:Po[y],colors:$[y]},1500),y=(y+1)%$.length});
