import { IRotateAnimationProps } from "../../types";
import { BaseAnimation } from "./Animation";

export class RotateAnimation extends BaseAnimation {
    constructor(protected props: IRotateAnimationProps) {
        super(props);
    }
    public async execute(): Promise<void> {
        const elementToRotate = document.getElementById(this.props.elementId);

        const animationFn = () => {
            this.rotateElement(elementToRotate, this.props.degrees);
        };
        await this.animate(animationFn);

        if (this.props.removeAfterComplete && elementToRotate?.parentElement) {
            elementToRotate.parentElement.removeChild(elementToRotate);
        }
    }

    protected rotateElement(element: HTMLElement, degrees: number) {
        const computedTransform = getComputedStyle(element).transform;
        const originalTransform = computedTransform !== "none" ? computedTransform : "";
        element.style.transition = `transform ${this.duration}ms ease-in-out`;
        element.offsetHeight; // Force reflow
        element.style.transform = `rotate(${degrees}deg) ${originalTransform}`;
    }
}
