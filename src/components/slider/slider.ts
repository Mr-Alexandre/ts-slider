enum SliderClasses {
    main = 'lav-slider',
    btnLeft = 'lav-slider__btn-left',
    btnRight = 'lav-slider__btn-right',
    btnDisabled = 'lav-slider__btn_disabled',
    dots = 'lav-slider__dots',
    dot = 'lav-slider_dot',
    dotActive = 'lav-slider_dot_active',
    contents = 'lav-slider__contents',
    window = 'lav-slider__window',
    item = 'lav-slider__item',
    itemActive = 'lav-slider__item_active',
    duration = 'lav-slider__window_duration',
}
enum SliderAxis {
    horizontal,
    vertical
}
interface SliderConfig {
    btnLeft?: HTMLElement,
    btnRight?: HTMLElement,
    dotsBox?: HTMLElement,
    axis?: SliderAxis,
    visibleItems?: number,
    gutter?: number,
    fixedWidth?: number | boolean,
    autoWidth?: boolean,
    startIndex?: number,
    speed?: number,
    autoplayTimeout?: number,
    hasControls?: boolean,
    hasDots?: boolean,
    isLoop?: boolean,
    isAutoplay?: boolean,
    isHoverPause?: boolean,
    isRewind?: boolean,
    isAutoHeight?: boolean,
    isMouseDrag?: boolean,
    isActiveSlideInCenter?: boolean,
}

interface SliderCursor {
    lastX: number,
    lastY: number,
}

interface SliderDimension {
    window: number,
    windowPer: number,
    items: Array<number>,
    itemsPer?: Array<number>,
}

export default class Slider {

    private slider: HTMLElement;
    private contents: HTMLElement;
    private items: HTMLCollectionOf<Element>;
    private window: HTMLElement;
    private dotsBox: HTMLElement = null;
    private dots: HTMLCollectionOf<Element> = null;

    private durationClass: string;
    private currentPosition: number;
    private lastPosition: number;

    private cursorPos: SliderCursor = {
        lastX: null,
        lastY: null
    };

    private config: SliderConfig = {
        axis: SliderAxis.horizontal,
        visibleItems: 1,
        gutter: 0,
        fixedWidth: false,
        autoWidth: false,
        startIndex: 1,
        speed: 400,
        autoplayTimeout: 5000,
        hasControls: true,
        hasDots: true,
        isLoop: false,
        isAutoplay: false,
        isHoverPause: true,
        isRewind: false,
        isAutoHeight: false,
        isMouseDrag: true,
        isActiveSlideInCenter: false,
    };

    private countItem: number;
    private dimension: SliderDimension = {
        window: 0,
        windowPer: 0,
        items: [],
        itemsPer: []
    };


    constructor(slider: HTMLElement, config?: SliderConfig) {
        if (!slider) return;

        this.slider = slider;
        this.contents = this.slider.querySelector(`.${SliderClasses.contents}`);
        this.window = this.slider.querySelector(`.${SliderClasses.window}`);
        this.items = this.window.getElementsByClassName(`${SliderClasses.item}`);
        this.config.btnLeft = this.slider.querySelector(`.${SliderClasses.btnLeft}`);
        this.config.btnRight = this.slider.querySelector(`.${SliderClasses.btnRight}`);
        this.config.dotsBox = this.slider.querySelector(`.${SliderClasses.dots}`);

        this.mergeConfig(config);
        this.checkStartIndex();

        this.countItem = this.items.length;
        this.currentPosition = this.config.startIndex;
        this.lastPosition = null;

        this.init();
    }

    private mergeConfig(config: SliderConfig): void {
        let defaultConfig: SliderConfig = this.config;
        this.config = {...defaultConfig, ...config};
    }

    private setSpeed(): void {
        this.durationClass = SliderClasses.duration;
        if (this.config.speed != 400) {
            let style = document.createElement('style');
            style.innerHTML = `
            .${SliderClasses.duration} {
                transition-duration: ${this.config.speed}ms
            }
            `;
            document.head.appendChild(style);
        }
        this.window.classList.add(this.durationClass);

    }

    private calcProperty(): void {
        let widthSlider: number = this.slider.offsetWidth;
        for (let i = 0; i < this.countItem; i++) {
            this.dimension.items.push((<HTMLElement>this.items.item(i)).offsetWidth);
        }

        if (!this.config.autoWidth) {
            this.dimension.window = widthSlider * this.countItem;
        } else {
            this.dimension.window = this.dimension.items.reduce((first, next) => {
                return first + next;
            })
        }

        this.dimension.windowPer = (this.dimension.window/widthSlider) * 100;

        this.dimension.items.forEach(value => {
            this.dimension.itemsPer.push( (value/this.dimension.window) * 100 );
        })

    }

    private checkStartIndex(): void {
        if (this.config.startIndex <= 0) {
            this.config.startIndex = 1;
        }
    }

    private prev(): void {
        this.calcPrevPosition();
        this.updateAutoHeight();
        this.updateBtnStyle();
        this.updateDotsStyle();
        if (this.lastPosition == 1) {
            if (this.config.isLoop) {

            }
            if (this.config.isRewind) {
                this.setPosition(-this.getLastPos());
            }
        } else {
            let currentWidth: number = this.getTranslateXValue();
            this.setPosition(-(currentWidth - this.getIncrease()));
        }

    }

    private next(): void {
        this.calcNextPosition();
        this.updateAutoHeight();
        this.updateBtnStyle();
        this.updateDotsStyle();
        if (this.lastPosition == this.dimension.items.length) {
            if (this.config.isLoop) {

            }
            if (this.config.isRewind) {
                this.setPosition(0);
            }
        } else {
            let currentWidth: number = this.getTranslateXValue();
            this.setPosition(-(currentWidth + this.getIncrease()));
        }

    }

    private getTranslateXValue(): number {
        return parseFloat(this.window.getAttribute('style').match(/translateX\([-+]?\d+(.\d+)?\%\)/)[0].replace(/[^0-9.]/g, ''));
    }

    private setButtonEvents(): void {
        this.config.btnLeft.addEventListener('click', ()=> {
            this.prev();
        });
        this.config.btnRight.addEventListener('click', ()=> {
            this.next();
        });
    }

    private setPosition(pos: number, start?: boolean): void {
        this.window.style.transform = `translateX(${pos}%)`;
        // if (this.isIE() && this.isIE() <= 9) {
        //     this.window.style.cssText += `transform: translateX(${pos}%)`;
        // } else {
        //     this.window.style.cssText += `transform: translateX(${pos}%)`;
        // }
    }

    private isIE (): number | boolean {
        let myNav = navigator.userAgent.toLowerCase();
        return (myNav.indexOf('msie') != -1) ? parseInt(myNav.split('msie')[1]) : false;
    }

    private setDefaultSlidePosition(): void {
        if (this.config.startIndex == 1) {
            this.setPosition(0, true);
        } else {
            this.setPosition(-this.getIncrease(), true);
        }
    }

    private calcPrevPosition(): void {
        if (this.currentPosition - 1 >= 1){
            this.lastPosition = this.currentPosition;
            this.currentPosition--;
        } else {
            this.lastPosition = this.currentPosition;
            if (this.config.isLoop || this.config.isRewind) {
                this.currentPosition = this.dimension.itemsPer.length;
            }
        }

    }

    private calcNextPosition(): void {
        if (this.currentPosition + 1 <= this.dimension.itemsPer.length){
            this.lastPosition = this.currentPosition;
            this.currentPosition++;
        } else {
            this.lastPosition = this.currentPosition;
            if (this.config.isLoop || this.config.isRewind) {
                this.currentPosition = 1;
            }
        }
    }

    private getIncrease(): number {
        let nextPos: number = this.currentPosition - 1;
        return this.dimension.itemsPer[this.currentPosition - 1];
    }

    private getLastPos(): number {
        let nextPos: number = this.currentPosition - 1;
        let increase: number = 0;
        this.dimension.itemsPer.forEach((value, index) => {
            if (index < nextPos) {
                increase +=value;
            }
        });
        return increase;
    }

    private setSizeDisplayedArea(): void {
        let style: string = '';
        if (!this.config.isAutoHeight){
            style += 'height: 100%; ';
        }
        style += `width: ${this.dimension.windowPer}%; `;

        this.window.style.cssText += style;
    }

    private setAutoHeight(): void {
        if (this.config.isAutoHeight){
            this.slider.style.height = (<HTMLElement>this.items.item(this.config.startIndex-1)).offsetHeight+'px';
        }
    }

    private updateAutoHeight(): void {
        if (this.config.isAutoHeight){
            this.slider.style.height = (<HTMLElement>this.items.item(this.currentPosition-1)).offsetHeight+'px';
        }
    }

    private updateBtnStyle(): void {
        if (!this.config.isRewind && !this.config.isLoop) {
            if (this.currentPosition == 1) {
                this.config.btnLeft.classList.add(SliderClasses.btnDisabled);
            } else {
                this.config.btnLeft.classList.remove(SliderClasses.btnDisabled);
            }
            if (this.currentPosition == this.dimension.items.length) {
                this.config.btnRight.classList.add(SliderClasses.btnDisabled);
            } else {
                this.config.btnRight.classList.remove(SliderClasses.btnDisabled);
            }
        }
    }

    private createDots(): void {
        let dotsBox: HTMLElement = this.slider.querySelector(`.${SliderClasses.dots}`);
        if (this.config.hasDots) {
            if (dotsBox) {
                this.dotsBox = dotsBox;
                /*Clear all children*/
                this.dotsBox.innerHTML = '';
                this.dotsBox.appendChild(this.createFragmentDots());
                this.dots = this.dotsBox.getElementsByClassName(SliderClasses.dot);
            } else {
                let fragment: DocumentFragment = document.createDocumentFragment();
                let dotsBox: HTMLElement = document.createElement('div');
                    dotsBox.classList.add(SliderClasses.dots);
                fragment.appendChild(dotsBox);
                fragment.firstChild.appendChild(this.createFragmentDots());
                this.slider.appendChild(fragment);
                this.dotsBox = this.slider.querySelector(`.${SliderClasses.dots}`);
                this.dots = this.dotsBox.getElementsByClassName(SliderClasses.dot);
            }
        } else {
            if (dotsBox) {
                this.slider.removeChild(dotsBox);
            }
        }
    }

    private updateDotsStyle(): void {
        if (this.config.hasDots) {
            this.dots.item(this.lastPosition - 1).classList.remove(SliderClasses.dotActive);
            this.dots.item(this.currentPosition - 1).classList.add(SliderClasses.dotActive);
        }
    }

    private createFragmentDots(): DocumentFragment {
        let fragment: DocumentFragment = document.createDocumentFragment();
        for (let i = 0; i < this.countItem; i++) {
            let dot: HTMLElement = document.createElement('div');
            dot.classList.add(SliderClasses.dot);
            if (i == this.currentPosition -1){
                dot.classList.add(SliderClasses.dotActive);
            }
            fragment.appendChild(dot);
        }
        return fragment;
    }

    private attachTrackCursorPosition(): void {
        if (this.config.isHoverPause) {
            let listener: EventListener = this.debounce( (e: MouseEvent) => {
                this.cursorPos.lastX = e.clientX;
                this.cursorPos.lastY = e.clientY;
            }, 120);

            window.addEventListener('mousemove', listener);
        }
    }

    private activateAutoPlay(): void {
        window.onblur = () => {
            document.title='документ неактивен'
        };
        window.onfocus = () => {
            document.title='Page'
        };
        if (this.config.isAutoplay) {
            setInterval(()=>{
                if (this.isHover()){
                    return;
                }
                this.next();
            }, this.config.autoplayTimeout)
        }
    }

    private polyffil(): void {
        /**
         * Element.closest() | MDN
         * Included IE9+ support
         * https://developer.mozilla.org/ru/docs/Web/API/Element/closest
         */
        (function(ELEMENT) {
            ELEMENT.matches = ELEMENT.matches || ELEMENT.mozMatchesSelector || ELEMENT.msMatchesSelector || ELEMENT.oMatchesSelector || ELEMENT.webkitMatchesSelector;
            ELEMENT.closest = ELEMENT.closest || function closest(selector) {
                if (!this) return null;
                if (this.matches(selector)) return this;
                if (!this.parentElement) {return null}
                else return this.parentElement.closest(selector)
            };
        }(Element.prototype));

        /**
         * ClassList | MDN
         * Included IE9+ support
         * https://developer.mozilla.org/ru/docs/Web/API/Element/classList
         */
        ;(function() {
            var regExp = function(name) {
                return new RegExp('(^| )'+ name +'( |$)');
            };
            var forEach = function(list, fn, scope) {
                for (var i = 0; i < list.length; i++) {
                    fn.call(scope, list[i]);
                }
            };

            // class list object with basic methods
            function ClassList(element) {
                this.element = element;
            }

            ClassList.prototype = {
                add: function() {
                    forEach(arguments, function(name) {
                        if (!this.contains(name)) {
                            this.element.className += ' '+ name;
                        }
                    }, this);
                },
                remove: function() {
                    forEach(arguments, function(name) {
                        this.element.className =
                            this.element.className.replace(regExp(name), '');
                    }, this);
                },
                toggle: function(name) {
                    return this.contains(name)
                        ? (this.remove(name), false) : (this.add(name), true);
                },
                contains: function(name) {
                    return regExp(name).test(this.element.className);
                },
                // bonus..
                replace: function(oldName, newName) {
                    this.remove(oldName), this.add(newName);
                }
            };

            // IE8/9, Safari
            if (!('classList' in Element.prototype)) {
                Object.defineProperty(Element.prototype, 'classList', {
                    get: function() {
                        return new ClassList(this);
                    }
                });
            }

            // replace() support for others
            if (window.DOMTokenList && DOMTokenList.prototype.replace == null) {
                DOMTokenList.prototype.replace = ClassList.prototype.replace;
            }
        })();
    }

    private isHover(): boolean {
        let elementMouseIsOver: Element = document.elementFromPoint(this.cursorPos.lastX, this.cursorPos.lastY);
        return elementMouseIsOver.closest(`.${SliderClasses.main}`) ? true : false;
    }

    private debounce<F extends (...params: any[]) => void>(func: F, delay: number) {
        let timeoutID: number = null;
        return function(this: any, ...args: any[]) {
            clearTimeout(timeoutID);
            timeoutID = window.setTimeout(() => func.apply(this, args), delay);
        } as F;
    }

    private setWidthItems(): void {
        for (let i = 0; i < this.countItem; i++) {

        }
    }

    private init(): void {
        this.polyffil();

        this.calcProperty();
        this.setAutoHeight();
        this.setDefaultSlidePosition();
        this.setSizeDisplayedArea();
        this.updateBtnStyle();
        this.setSpeed();
        this.createDots();
        this.setButtonEvents();
        this.activateAutoPlay();
        this.attachTrackCursorPosition();

    }


}

