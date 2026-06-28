import { ANIMATION_LAYER_ID } from "@shared/constants";

export class AnimationLayer {
    public _layer: HTMLElement;
    private animationIdToCopiedElementsMap = new Map<string, HTMLElement[]>();

    get layer(): HTMLElement {
        return this._layer;
    }

    constructor() {
        this.initialiseLayer();
    }

    public wrapAndCopyToLayer(
        animationId: string,
        elementsToAnimate: HTMLElement[],
        refId: string,
        customRect?: DOMRect,
    ): HTMLElement {
        this.initialiseLayer();

        const wrapper = document.createElement("div");
        wrapper.id = refId;

        // Calculate bounding box of all elements
        const rects = elementsToAnimate.map((el) => el.getBoundingClientRect());
        const minTop = Math.min(...rects.map((r) => r.top));
        const minLeft = Math.min(...rects.map((r) => r.left));
        const maxBottom = Math.max(...rects.map((r) => r.bottom));
        const maxRight = Math.max(...rects.map((r) => r.right));

        // Position each clone within the wrapper based on its rendered DOM position
        elementsToAnimate.forEach((elementToAnimate, i) => {
            const clone = elementToAnimate.cloneNode(true) as HTMLElement;
            const rect = rects[i];
            clone.style.position = "absolute";
            clone.style.top = `${rect.top - minTop}px`;
            clone.style.left = `${rect.left - minLeft}px`;
            clone.style.width = `${rect.width}px`;
            clone.style.height = `${rect.height}px`;
            wrapper.appendChild(clone);
        });

        const wrapperWidth = maxRight - minLeft;
        const wrapperHeight = maxBottom - minTop;
        const boundingRect = new DOMRect(minLeft, minTop, wrapperWidth, wrapperHeight);

        const { top, left } = this.calculateRelativePosition(
            customRect ?? boundingRect,
            this.layer.getBoundingClientRect(),
        );

        this.addToAnimationMap(animationId, wrapper);
        this.layer.appendChild(wrapper);

        wrapper.style.position = "absolute";
        wrapper.style.top = `${top}px`;
        wrapper.style.left = `${left}px`;
        wrapper.style.width = `${wrapperWidth}px`;
        wrapper.style.height = `${wrapperHeight}px`;

        return wrapper;
    }

    public copyToLayer(animationId: string, elementToAnimate: HTMLElement, customRect?: DOMRect): HTMLElement {
        this.initialiseLayer();

        const sourceRect = customRect ?? elementToAnimate.getBoundingClientRect();
        const { top, left } = this.calculateRelativePosition(sourceRect, this.layer.getBoundingClientRect());

        const clone = elementToAnimate.cloneNode(true) as HTMLElement;
        this.addToAnimationMap(animationId, clone);
        this.layer.appendChild(clone);

        clone.style.position = "absolute";
        clone.style.top = `${top}px`;
        clone.style.left = `${left}px`;

        clone.style.width = `${sourceRect.width}px`;
        clone.style.height = `${sourceRect.height}px`;

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
        const top = elementRect.top - layerRect.top;
        const left = elementRect.left - layerRect.left;
        return { top, left };
    }

    private initialiseLayer() {
        if (!this.layer) {
            this._layer = document.getElementById(ANIMATION_LAYER_ID);
        }
    }
}
