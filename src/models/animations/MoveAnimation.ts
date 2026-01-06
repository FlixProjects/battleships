import { CELL_SEPARATOR } from "../../../shared";
import { appConfig } from "../../config/app-config";
import { IAnimation, IMoveAnimationProps } from "../../types";

const DEFAULT_CANCEL_CLICK = () => {
    if (appConfig.deployEnv === "local") {
        console.log("no animation to cancel");
    }
};

type TResolve = (value: void | PromiseLike<void>) => void;

export class MoveAnimation implements IAnimation {
    private onCancelClick: () => void = DEFAULT_CANCEL_CLICK;
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

    private animate(runAnimation: () => void): Promise<void> {
        return new Promise((resolve) => this.runAnimationFlow(resolve, runAnimation));
    }

    private runAnimationFlow(resolve: TResolve, runAnimation: () => void) {
        this.loadCancelClickHandler(resolve);
        this.addCancelAnimationListener();
        runAnimation();
        this.startAnimationTimer();
    }

    private loadCancelClickHandler(resolve: TResolve) {
        const onCancelClick = this.getEndAnimation(resolve);
        this.onCancelClick = onCancelClick;
        return onCancelClick;
    }

    private startAnimationTimer() {
        return setTimeout(() => {
            this.onCancelClick();
        }, this.duration);
    }

    private getEndAnimation(resolve: TResolve) {
        const onCancelClick = () => {
            resolve();
            this.resetCancelClickListener();
            document.removeEventListener("click", onCancelClick);
        };
        return onCancelClick;
    }

    private resetCancelClickListener() {
        this.onCancelClick = DEFAULT_CANCEL_CLICK;
    }

    private addCancelAnimationListener() {
        document.addEventListener("click", this.onCancelClick);
    }
}
