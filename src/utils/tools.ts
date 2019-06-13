export interface LooseObject {
    [key: string]: any
}


export function getIndexElement(container: HTMLElement, element: HTMLElement): number {
    let containerArray: Array<HTMLElement> = [].slice.call( container.children );
    return containerArray.indexOf(element, 0);
}

export function definitionElementOnClick(event: Event, selector: string): Element {
    return  ( <Element> event.target ).closest(`${selector}`);
}

export function globalEventDelegate(event: string, selector: string, callbackSuccess: Function, callbackFailed?: Function): void{
    addEventListener(event, (event: Event) => {
        let element: Element = definitionElementOnClick(event, selector);

        if ( element ) {
            callbackSuccess(element);
            return;
        } else if ( callbackFailed ) {
            callbackFailed(event.target);
        }
    });
}

export function getAttributesElement(element: HTMLElement | Element): LooseObject {
    let obj: LooseObject = {};

    if ( element.hasAttributes() ) {
        let attr = element.attributes;

        for ( let i = 0, len = attr.length; i < len; i++ ){
            obj[ attr[i].nodeName ] = attr[i].nodeValue
        }

        return obj;
    }

    return null;
}
