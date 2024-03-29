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
    additionalContainer = 'lav-slider__add-container',
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
    countSwipe?: number,
    gutter?: number,
    fixedWidth?: number,
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
    private addContainer: HTMLElement;
    private items: HTMLCollectionOf<Element>;
    private window: HTMLElement;
    private dotsBox: HTMLElement = null;
    private dots: HTMLCollectionOf<Element> = null;

    private durationClass: string;
    private currentPosition: number;
    private lastPosition: number;

    private moveHandler: EventListener;
    private moveEndHandler: EventListener;
    private fixedSliderX: number;
    private liveSliderX: number;
    private startX: number;

    private cursorPos: SliderCursor = {
        lastX: null,
        lastY: null
    };

    private config: SliderConfig = {
        axis: SliderAxis.horizontal,
        visibleItems: 1,
        countSwipe: 1,
        gutter: 0,
        fixedWidth: null,
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
    private LeftXItem: number;
    private RightXItem: number;
    private indexDragItem: number;
    private increment: number;


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
        this.lastPosition = this.currentPosition;

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

        if (!this.config.autoWidth) {
            this.dimension.window = widthSlider * this.countItem;
            for (let i = 0; i < this.countItem; i++) {
                if (this.config.visibleItems) {
                    this.dimension.items.push(widthSlider / this.config.visibleItems);
                } else {
                    this.dimension.items.push(widthSlider);
                }

            }
        } else {
            this.dimension.window = this.dimension.items.reduce((first, next) => {
                return first + next;
            });
            for (let i = 0; i < this.countItem; i++) {
                this.dimension.items.push((<HTMLElement>this.items.item(i)).offsetWidth);
            }
        }

        this.dimension.windowPer = (this.dimension.window/widthSlider) * 100;

        for (let i = 0, len = this.dimension.items.length; i < len; i++) {
            this.dimension.itemsPer.push( (this.dimension.items[i]/this.dimension.window) * 100 );
        }

    }

    private checkStartIndex(): void {
        this.config.startIndex = this.config.startIndex - 1;
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

    private setDotsEvents(): void {
        if (!this.config.hasDots) return;

        this.dotsBox.addEventListener('click', (event: Event) => {
            let dot: HTMLElement = <HTMLElement>( <Element> event.target ).closest(`.${SliderClasses.dot}`);
            if (dot) {
                let index: number = this.getIndexElement(this.dotsBox, dot);
                this.goTo(index);
            }
        })
    }

    private setDragEvents(): void {
        if (this.config.isMouseDrag) {

            this.globalEventDelegate('mousedown', `.${SliderClasses.item}`, (element: Element, event: MouseEvent) => {
                let parent: HTMLElement = <HTMLElement> element.closest(`.${SliderClasses.main}`);
                if (parent == this.slider) {
                    this.dragStart(<HTMLElement> element, event);
                }
            });

        }
    }

    private dragStart(item: HTMLElement, event: MouseEvent): void {
        event.preventDefault();

        this.fixedSliderX = Math.abs(this.getTranslateXValue());
        this.liveSliderX = this.fixedSliderX;
        this.startX = event.pageX;
        this.LeftXItem = item.getBoundingClientRect().left;
        this.RightXItem = item.getBoundingClientRect().right;
        this.indexDragItem = this.getIndexElement(this.window, item);

        this.moveHandler = (mouseEvent: MouseEvent) => {
            this.drag(mouseEvent);
        };
        this.moveEndHandler = (mouseEvent: MouseEvent) => {
            this.dragEnd(mouseEvent);
        };

        item.addEventListener('dragstart', () => {
            return false;
        });

        this.switchShuffleAnimation(false);

        document.onmousemove = this.moveHandler;
        document.onmouseup = this.moveEndHandler;
        document.ontouchmove = this.moveHandler;
        document.ontouchend = this.moveEndHandler;

        // document.addEventListener('mousemove', this.moveHandler);
        // document.addEventListener('mouseup', this.moveEndHandler);
        // document.addEventListener('touchmove', this.moveHandler);
        // document.addEventListener('touchend', this.moveEndHandler);

    }

    private drag(mouseEvent: MouseEvent): void {
        mouseEvent.preventDefault();

        let increment = ()=> {
            let dist: number = this.startX - mouseEvent.pageX;
            let distInPer: number = (dist / this.dimension.items[this.indexDragItem]) * 100;
            let inc: number = this.dimension.itemsPer[this.indexDragItem] * (distInPer / 100);
            return inc;
        };

        let inc: number = increment();
        this.increment = inc;

        this.liveSliderX = this.fixedSliderX + inc;
        this.setPosition(-this.liveSliderX);

    }

    private switchShuffleAnimation(status: boolean): void {
        if (status) {
            this.window.style.transitionDuration = '';
        } else {
            this.window.style.transitionDuration = '0ms';
        }
    }

    private dragEnd(mouseEvent: Event): void {
        this.switchShuffleAnimation(true);

        if (this.increment >= this.dimension.itemsPer[this.indexDragItem] >> 1) {
            this.goTo(this.indexDragItem + 1);
        } else if (this.increment <= -(this.dimension.itemsPer[this.indexDragItem] >> 1)) {
            this.goTo(this.indexDragItem - 1);
        } else {
            this.setPosition(-this.fixedSliderX);
        }

        document.onmousemove = null;
        document.onmouseup = null;
        document.ontouchmove = null;
        document.ontouchend = null;
        // document.removeEventListener('mousemove', this.moveHandler);
        // document.removeEventListener('mouseup', this.moveEndHandler);
        // document.removeEventListener('touchmove', this.moveHandler);
        // document.removeEventListener('touchend', this.moveEndHandler);
    }

    private globalEventDelegate(event: string, selector: string, callbackSuccess: Function, callbackFailed?: Function): void{
        addEventListener(event, (event: MouseEvent) => {
            let element: Element = ( <Element> event.target ).closest(`${selector}`);

            if (element) {
                callbackSuccess(element, event);
                return;
            } else if (callbackFailed) {
                callbackFailed(event);
            }
        });
    }

    private getIndexElement(container: HTMLElement | Element, element: HTMLElement): number {
        let containerArray: Array<HTMLElement> = [].slice.call( container.children );
        return containerArray.indexOf(element, 0);
    }

    private setPosition(pos: number, start?: boolean): void {
        this.window.style.transform = `translateX(${pos}%)`;
        // if (this.isIE() && this.isIE() <= 9) {
        //     this.window.style.cssText += `transform: translateX(${pos}%)`;
        // } else {
        //     this.window.style.cssText += `transform: translateX(${pos}%)`;
        // }
    }

    private setDefaultSlidePosition(): void {
        if (!this.config.startIndex) {
            this.setPosition(0, true);
        } else {
            const countDots: number = this.config.visibleItems ? this.countItem / this.config.visibleItems : this.config.visibleItems;
            if (this.currentPosition +1 > countDots) {
                this.setPosition(0, true);
            } else {
                this.setPosition(-this.getNextPosition(), true);
            }
        }
    }

    private isIE (): number | boolean {
        let myNav = navigator.userAgent.toLowerCase();
        return (myNav.indexOf('msie') != -1) ? parseInt(myNav.split('msie')[1]) : false;
    }

    private getNextPosition(index: number = this.currentPosition): number {
        let nextPos: number = index;
        let increase: number = 0;
        this.dimension.itemsPer.forEach((value, index) => {
            if (index < nextPos) {
                increase +=value;
            }
        });
        return increase;
    }

    private setItemSize(): void {
        this.dimension.itemsPer.forEach((value, index) => {
            (<HTMLElement>this.items.item(index)).style.width = `${value}%`;
        })
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
            this.slider.style.height = (<HTMLElement>this.items.item(this.config.startIndex)).offsetHeight+'px';
        }
    }

    private updateAutoHeight(): void {
        if (this.config.isAutoHeight){
            this.slider.style.height = (<HTMLElement>this.items.item(this.currentPosition)).offsetHeight+'px';
        }
    }

    private updateBtnStyle(): void {
        if (!this.config.isRewind && !this.config.isLoop) {
            if (!this.currentPosition) {
                this.config.btnLeft.classList.add(SliderClasses.btnDisabled);
            } else {
                this.config.btnLeft.classList.remove(SliderClasses.btnDisabled);
            }
            if (this.currentPosition == this.dimension.items.length - 1) {
                this.config.btnRight.classList.add(SliderClasses.btnDisabled);
            } else {
                this.config.btnRight.classList.remove(SliderClasses.btnDisabled);
            }
        }
    }

    private updateDotsStyle(): void {
        if (this.config.hasDots) {
            this.dots.item(this.lastPosition).classList.remove(SliderClasses.dotActive);
            this.dots.item(this.currentPosition).classList.add(SliderClasses.dotActive);
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

    private createFragmentDots(): DocumentFragment {
        let fragment: DocumentFragment = document.createDocumentFragment();
        const countDots: number = this.config.visibleItems ? this.countItem / this.config.visibleItems : this.config.visibleItems;
        for (let i = 0; i < countDots; i++) {
            let dot: HTMLElement = document.createElement('div');
            dot.classList.add(SliderClasses.dot);

            if (this.currentPosition +1 > countDots) {
                if (i == 0){
                    dot.classList.add(SliderClasses.dotActive);
                }
                // throw new Error('Неправильно переданное значение позимии');
            } else {
                if (i == this.currentPosition){
                    dot.classList.add(SliderClasses.dotActive);
                }
            }
            fragment.appendChild(dot);
        }
        return fragment;
    }

    private createAdditionalElementsForLoop(): void {
        let addContainer: HTMLElement = document.createElement('div');
        addContainer.classList.add(SliderClasses.additionalContainer);
        let fragment: DocumentFragment = document.createDocumentFragment();

        let visibleItems: number = this.config.visibleItems;
        let width: number = 0;
        let widthPer: number = 0;
        /*add first items*/
        for (let i = 0; i < visibleItems; i++) {
            /*add first items*/
            fragment.appendChild(this.items.item(i).cloneNode(true));

            /*add last items*/
            let index: number = this.items.length - (i+1);
            fragment.appendChild(this.items.item(index).cloneNode(true));

            /*Calc width*/
            width += this.dimension.items[i] + this.dimension.items[index];
        }
        widthPer = (this.dimension.window/width) * 100;

        addContainer.append(fragment);
        this.contents.appendChild(addContainer);
        this.addContainer = this.contents.querySelector(`.${SliderClasses.additionalContainer}`);

        /*Calc style*/
        let style: string = '';
        if (!this.config.isAutoHeight){
            style += 'height: 100%; ';
        }

        style += `width: ${widthPer}%; `;
        this.addContainer.style.cssText += style;

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

    // @ts-ignore-start
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
    // @ts-ignore-end

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

    }

    private getNextPosIfNotDeedEnd(position: number): number {
        if (position > this.countItem - 1) {
            return Math.abs(position - this.countItem);
        } else if (position < 0) {
            return Math.abs(this.countItem  - Math.abs(position));
        }
        return position;
    }

    private init(): void {
        this.polyffil();

        this.calcProperty();
        this.setAutoHeight();
        this.setDefaultSlidePosition();
        this.setSizeDisplayedArea();
        this.setItemSize();
        this.updateBtnStyle();
        this.setSpeed();
        this.createDots();
        this.setButtonEvents();
        this.setDotsEvents();
        this.setDragEvents();
        this.activateAutoPlay();
        this.attachTrackCursorPosition();
        this.createAdditionalElementsForLoop();
    }

    public prev(): void {

        if (this.config.isLoop || this.config.isRewind) {
            let nextPos: number = this.getNextPosIfNotDeedEnd(this.currentPosition - this.config.countSwipe);
            this.goTo(nextPos);
        } else {
            let nextPos: number = this.currentPosition - this.config.countSwipe;
            this.goTo(nextPos);
        }

    }

    public next(): void {

        if (this.config.isLoop || this.config.isRewind) {
            let nextPos: number = this.getNextPosIfNotDeedEnd(this.currentPosition + this.config.countSwipe);
            this.goTo(nextPos);
        } else {
            let nextPos: number = this.currentPosition + this.config.countSwipe;
            this.goTo(nextPos);
        }

    }

    public goTo(index: number): void {
        if (index >= this.dimension.items.length) {
            index = this.dimension.items.length - 1;
        } else if (index < 0) {
            index = 0;
        }
        this.lastPosition = this.currentPosition;
        this.currentPosition = index;
        this.updateAutoHeight();
        this.updateBtnStyle();
        this.updateDotsStyle();
        this.setPosition(-this.getNextPosition(index));
    }


}

