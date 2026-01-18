import { ANIMATION_LAYER_ID } from "../../shared";

export class AnimationLayer {
    public _layer: HTMLElement;

    get layer(): HTMLElement {
        return this._layer;
    }

    constructor() {
        this.initialiseLayer();
    }

    public copyToLayer(elementToAnimate: HTMLElement) {
        this.initialiseLayer();

        const { top, left } = this.calculateRelativePosition(
            elementToAnimate.getBoundingClientRect(),
            this.layer.getBoundingClientRect(),
        );

        const clone = elementToAnimate.cloneNode(true) as HTMLElement;
        this.layer.appendChild(clone);

        clone.style.position = "absolute";
        clone.style.top = `${top}px`;
        clone.style.left = `${left}px`;

        return clone;
    }

    public reloadLayer() {
        this._layer = document.getElementById(ANIMATION_LAYER_ID);
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
