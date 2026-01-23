import { GAME_BOARD_ID } from "../../../shared/constants";
import { IHitAnimationProps } from "../../types";
import { BaseAnimation } from "./Animation";

export class HitAnimation extends BaseAnimation {
    constructor(private props: IHitAnimationProps) {
        super({ duration: props.duration || 1200 });
        // FIXME: I don't like this implementation
        if (!this.elements) {
            this.elements = this.getOwnElements();
        }
    }

    public async execute(): Promise<void> {
        const shipElements = this.elements;

        if (shipElements.length === 0) return;

        await Promise.all(
            shipElements.map((element) => {
                const animationFn = () => {
                    const computedTransform = getComputedStyle(element).transform;
                    const baseTransform = computedTransform !== "none" ? computedTransform : "";
                    element.style.setProperty("--base-transform", baseTransform);
                    element.style.animation = `shiver 0.4s ease-in-out`;
                };
                return this.animate(animationFn);
            }),
        );
    }

    private getOwnElements(): HTMLElement[] {
        const shipId = this.props.id;
        const _shipElements = Array.from(document.getElementById(GAME_BOARD_ID).querySelectorAll("img")).filter((img) =>
            img.alt.includes(shipId),
        );
        return _shipElements.map((el) => this.animationLayer.copyToLayer(this.id, el as HTMLElement));
    }
}
