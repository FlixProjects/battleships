import { ANIMATION_LAYER_ID } from "../../shared";

export class AnimationLayer {
    public _layer: HTMLElement;
    private animationIdToCopiedElementsMap = new Map<string, HTMLElement[]>();

    get layer(): HTMLElement {
        return this._layer;
    }

    constructor() {
        this.initialiseLayer();
    }

    public copyToLayer(animationId: string, elementToAnimate: HTMLElement, customRect?: DOMRect): HTMLElement {
        this.initialiseLayer();

        const { top, left } = this.calculateRelativePosition(
            customRect ?? elementToAnimate.getBoundingClientRect(),
            this.layer.getBoundingClientRect(),
        );

        const clone = elementToAnimate.cloneNode(true) as HTMLElement;
        this.addToAnimationMap(animationId, clone);
        this.layer.appendChild(clone);

        clone.style.position = "absolute";
        clone.style.top = `${top}px`;
        clone.style.left = `${left}px`;

        return clone;
    }

    public reloadLayer() {
        this._layer = document.getElementById(ANIMATION_LAYER_ID);
    }

    public destroyCopiedElements(animationId: string) {
        const elements = this.animationIdToCopiedElementsMap.get(animationId) || [];
        elements.forEach((el) => {
            el.remove();
        });
        this.animationIdToCopiedElementsMap.delete(animationId);
    }

    private addToAnimationMap(animationId: string, element: HTMLElement) {
        const existingElements = this.animationIdToCopiedElementsMap.get(animationId) || [];

        if (element) {
            existingElements.push(element);
            this.animationIdToCopiedElementsMap.set(animationId, existingElements);
        }
    }

    private calculateRelativePosition(elementRect: DOMRect, layerRect: DOMRect) {
        const top = elementRect.top - layerRect.top + window.scrollY;
        const left = elementRect.left - layerRect.left + window.scrollX;
        return { top, left };
    }

    private initialiseLayer() {
        if (!this.layer) {
            this._layer = document.getElementById(ANIMATION_LAYER_ID);
        }
    }
}
