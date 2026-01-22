import { GAME_BOARD_ID } from "../../../shared/constants";
import { IAnimationProps } from "../../types";
import { BaseAnimation } from "./Animation";

interface IDestroyedAnimationProps extends IAnimationProps {
    id: string;
}

export class DestroyedAnimation extends BaseAnimation {
    constructor(private props: IDestroyedAnimationProps) {
        super({ duration: props.duration || 1200 });
        // FIXME: I don't like this implementation
        const shipId = this.props.id;
        const _shipElements = Array.from(document.getElementById(GAME_BOARD_ID).querySelectorAll("img")).filter((img) =>
            img.alt.includes(shipId),
        );
        this.elements = _shipElements.map((el) => this.animationLayer.copyToLayer(this.id, el as HTMLElement));
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
                    element.style.animation = `shiver 0.4s ease-in-out, sink 0.8s ease-in 0.4s forwards`;
                };
                return this.animate(animationFn);
            }),
        );
    }
}
