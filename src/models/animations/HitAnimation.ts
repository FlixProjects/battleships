import { IHitAnimationProps } from "../../types";
import { HullBaseAnimation } from "./HullBaseAnimation";

export class HitAnimation extends HullBaseAnimation {
    constructor(props: IHitAnimationProps) {
        super({ duration: 400, ...props });
    }

    public async execute(): Promise<void> {
        const shipElements = this.copyElementsToLayer();

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
}
