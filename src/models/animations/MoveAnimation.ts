import { TILE_GAP_PX, TILE_SIZE_PX } from "@shared/constants";
import { IMoveAnimationProps } from "../../types/animations/types";
import { BaseAnimation } from "./Animation";

export class MoveAnimation extends BaseAnimation {
    constructor(protected props: IMoveAnimationProps) {
        super(props);
    }
    public async execute(): Promise<void> {
        const elementToMove = this.props.element;

        const [fromCol, fromRow] = this.props.fromCell;
        const [toCol, toRow] = this.props.toCell;

        const deltaX = (toCol - fromCol) * (TILE_SIZE_PX + TILE_GAP_PX);
        const deltaY = (toRow - fromRow) * (TILE_SIZE_PX + TILE_GAP_PX);

        const animationFn = () => {
            this.moveElement(elementToMove, deltaX, deltaY);
        };
        await this.animate(animationFn);

        if (this.props.removeAfterComplete && elementToMove?.parentElement) {
            elementToMove.parentElement.removeChild(elementToMove);
        }
    }

    protected moveElement(element: HTMLElement, deltaX: number, deltaY: number) {
        const computedTransform = getComputedStyle(element).transform;
        const originalTransform = computedTransform !== "none" ? computedTransform : "";
        element.style.transition = `transform ${this.duration}ms ease-in-out`;
        element.offsetHeight; // Force reflow
        element.style.transform = `translate(${deltaX}px, ${deltaY}px) ${originalTransform}`;
    }
}
