import { CELL_SEPARATOR } from "../../../shared";
import { IAnimation, IMoveAnimationProps } from "../../types";

export class MoveAnimation implements IAnimation {
    private duration: number;

    constructor(private props: IMoveAnimationProps) {
        this.duration = props.duration || 1000;
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

        await Promise.all(shipElements.map((element) => this.animateElement(element as HTMLElement, deltaX, deltaY)));


        shipElements.forEach((element) => {
            element.style.transition = "";
        });
    }

    private animateElement(element: HTMLElement, deltaX: number, deltaY: number): Promise<void> {
        return new Promise((resolve) => {
            const computedTransform = getComputedStyle(element).transform;
            const originalTransform = computedTransform !== 'none' ? computedTransform : '';
            
            element.style.transition = `transform ${this.duration}ms ease-in-out`;
            element.offsetHeight; // Force reflow

            element.style.transform = `translate(${deltaX}px, ${deltaY}px) ${originalTransform}`;

            setTimeout(() => resolve(), this.duration);
        });
    }
}
