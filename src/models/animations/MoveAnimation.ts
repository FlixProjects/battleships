import { CELL_SEPARATOR } from "../../../shared";
import { IMoveAnimationProps } from "../../types";
import { BaseAnimation } from "./Animation";

export class MoveAnimation extends BaseAnimation {
    constructor(private props: IMoveAnimationProps) {
        super(props);
    }
    public async execute(): Promise<void> {
        // TODO: we should pass in the elements to animate instead of querying the DOM
        const fromTile = document.getElementById(this.props.fromKey);
        const toTile = document.getElementById(this.props.toKey);

        if (!fromTile || !toTile) return;

        const shipElements = Array.from(fromTile.querySelectorAll("img")).filter(
            (img) => img.alt === this.props.shipId,
        );

        if (shipElements.length === 0) return;

        const [fromCol, fromRow] = this.props.fromKey.split(CELL_SEPARATOR).map(Number);
        const [toCol, toRow] = this.props.toKey.split(CELL_SEPARATOR).map(Number);

        const deltaX = (toCol - fromCol) * 50; // 48px tile + 2px gap
        const deltaY = (toRow - fromRow) * 50;

        await Promise.all(
            shipElements.map((element) => {
                const animationFn = () => {
                    this.moveElement(element, deltaX, deltaY);
                };
                return this.animate(animationFn);
            }),
        );
    }

    private moveElement(element: HTMLElement, deltaX: number, deltaY: number) {
        const computedTransform = getComputedStyle(element).transform;
        const originalTransform = computedTransform !== "none" ? computedTransform : "";
        element.style.transition = `transform ${this.duration}ms ease-in-out`;
        element.offsetHeight; // Force reflow
        element.style.transform = `translate(${deltaX}px, ${deltaY}px) ${originalTransform}`;
    }
}
