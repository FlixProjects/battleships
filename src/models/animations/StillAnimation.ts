import { IHullBaseAnimationProps } from "../../types";
import { HullBaseAnimation } from "./HullBaseAnimation";

export class StillAnimation extends HullBaseAnimation {
    constructor(props: IHullBaseAnimationProps) {
        super({ duration: 1000, ...props });
    }

    public async execute(): Promise<void> {
        const shipElements = this.copyElementsToLayer();

        if (shipElements.length === 0) return;

        await Promise.all(
            shipElements.map(() => {
                const animationFn = () => {
                    // No animation, just stay still
                };
                return this.animate(animationFn);
            }),
        );
    }
}
