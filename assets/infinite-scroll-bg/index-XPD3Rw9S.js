import"../modulepreload-polyfill-9p4a8sJU.js";const o=window.innerWidth;let a=1,n=80,e=1,s=document.documentElement;function d(t,i){s.style.setProperty("--base-height",t/i+"px")}d(o,a);document.getElementById("speed-up").addEventListener("mousedown",function(){n=n/2,s.style.setProperty("--animation-duration",n+"s")});document.getElementById("reset").addEventListener("mousedown",function(){n=80,s.style.setProperty("--animation-duration",n+"s")});document.getElementById("change").addEventListener("mousedown",function(){const t=document.querySelector(".image-ribbon");e===1?(t.style.backgroundImage="url(https://user-images.githubusercontent.com/623568/172631868-553412a8-2f95-4ac3-a7c3-d43ec8c69f4d.jpg)",d(o,1),e=2):e===2?(t.style.backgroundImage="url(https://user-images.githubusercontent.com/623568/172635964-166ab9f0-64d4-4c41-93bf-b3d01859046f.png)",d(o,1.03225806),e=3):e===3&&(t.style.backgroundImage="url(https://user-images.githubusercontent.com/623568/172632914-7726f517-ea2d-4a82-a4dd-26b541e125d9.jpg)",d(o,1),e=1)});