// function easeInOutExpo(x, t, b, c, d){
//     if (t==0) return b;
//     if (t==d) return b+c;
//     if ((t/=d/2) < 1) return c/2 * Math.pow(2, 10 * (t - 1)) + b;
//     return c/2 * (-Math.pow(2, -10 * --t) + 2) + b;
// }
//
// // setup
// var test = document.getElementById('test');
// var start = new Date().getTime();
// var from = test.offsetLeft;
// var to = 300;
// var duration = 400;
//
// // animation
// (function animate(){
//     var now = (new Date().getTime() - start);
//     var ease = easeInOutExpo(0, now, 0, 1, duration);
//     test.style.left = (from + (to - from) * ease)+'px';
//     if(now < duration){
//         setTimeout(animate, 1000/60);
//     }
// })();