interface JsAnimateOptions {
    from: number,
    to: number,
    duration?: number,
    timing?: Function,
    draw?: Function,
}

(function() {
    var lastTime = 0;
    var vendors = ['ms', 'moz', 'webkit', 'o'];
    for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
        window.requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame'];
        window.cancelAnimationFrame = window[vendors[x]+'CancelAnimationFrame']
            || window[vendors[x]+'CancelRequestAnimationFrame'];
    }

    if (!window.requestAnimationFrame)
        window.requestAnimationFrame = function(callback, element) {
            var currTime = new Date().getTime();
            var timeToCall = Math.max(0, 16 - (currTime - lastTime));
            var id = window.setTimeout(function() { callback(currTime + timeToCall); },
                timeToCall);
            lastTime = currTime + timeToCall;
            return id;
        };

    if (!window.cancelAnimationFrame)
        window.cancelAnimationFrame = function(id) {
            clearTimeout(id);
        };
}());

export default class JsAnimate {

    private element: HTMLElement;
    private option: JsAnimateOptions;
    private timeStart: number;

    constructor(element: HTMLElement, option: JsAnimateOptions) {
        if (!element) return;

        this.element = element;
        this.option = option;
    }

    public start(): void {
        this.timeStart = new Date().getTime();
        this.animate();
    }

    private animate(): void {
        let animate = ()=> {
            let now = (new Date().getTime() - this.timeStart);
            function easeInOutExpo(x: number, t: number, b: number, c: number, d: number){
                if (t==0) return b;
                if (t==d) return b+c;
                if ((t/=d/2) < 1) return c/2 * Math.pow(2, 10 * (t - 1)) + b;
                return c/2 * (-Math.pow(2, -10 * --t) + 2) + b;
            }
            function linear(time: number, begin: number, change: number, duration: number) {
                return change * time / duration + begin;
            }
            let ease = easeInOutExpo(0, now, 0, 1, this.option.duration);
            this.option.draw((this.option.from + (this.option.to - this.option.from) * ease));
            // test.style.left = (from + (to - from) * ease)+'px';
            if(now < this.option.duration){
                setTimeout(animate, 1000/60);
            }
        };
        this.executeAnimate(animate);
    }

    private executeAnimate(fn: Function) {
        window.requestAnimationFrame(()=> {
            window.requestAnimationFrame(()=> {
                fn();
            });
        });
    }

}

var btn: HTMLElement = document.getElementById('startTestJsAnimation');
if (btn){
    let el: HTMLElement = document.querySelector(`.testJsAnimation`);
    let anim = new JsAnimate(el, {
        from: el.offsetHeight,
        to: 300,
        duration: 1000,
        draw: (progress: number)=>{
            el.style.height = progress +'px';
        }
    })
    let anim2 = new JsAnimate(el, {
        from: el.offsetWidth,
        to: 500,
        duration: 1000,
        draw: (progress: number)=>{
            el.style.width = progress +'px';
        }
    })
    btn.addEventListener('click', ()=> {
        anim.start();
        anim2.start();
    })

}