import"../modulepreload-polyfill-9p4a8sJU.js";class h{constructor(t){this.el=t,this.setVars(),this.init()}setVars(){this.number=this.el.querySelectorAll("[data-countup-number]"),this.observerOptions={root:null,rootMargin:"0px 0px",threshold:0},this.observer=new IntersectionObserver(t=>{t.forEach(e=>{const r=parseFloat(e.target.dataset.countupNumber.replace(/,/g,"")),n=this.countDecimals(r);e.isIntersecting&&this.iterateValue(e.target,r,n)})},this.observerOptions)}init(){this.number.length>0&&this.number.forEach(t=>{this.observer.observe(t)})}iterateValue(t,e,r){let i=null;const o=a=>{i||(i=a);const c=(a-i)/2500,u=Math.min(this.easeOutQuint(c),1);let l=Math.abs(u*(e-0)+0);t.innerHTML=this.formatNumber(l,r),u<1&&window.requestAnimationFrame(o)};window.requestAnimationFrame(o)}easeOutQuad(t){return 1-Math.pow(1-t,3)}easeOutQuint(t){return 1-Math.pow(1-t,5)}countDecimals(t){return Math.floor(t)===t?0:t.toString().split(".")[1].length||0}formatNumber(t,e){return t.toLocaleString("en-US",{minimumFractionDigits:e,maximumFractionDigits:e})}}const m=[...document.querySelectorAll('[data-module="countup"]')];m.forEach(s=>{s.dataset.module.split(" ").forEach(function(){new h(s)})});
