import { HullBaseAnimation } from "./HullBaseAnimation";

export class DestroyedAnimation extends HullBaseAnimation {
    public async execute(): Promise<void> {
        const shipElements = this.copyElementsToLayer();

        if (shipElements.length === 0) return;

        await Promise.all(
            shipElements.map((element) => {
                const animationFn = () => {
                    const computedTransform = getComputedStyle(element).transform;
                    const baseTransform = computedTransform !== "none" ? computedTransform : "";
                    element.style.setProperty("--base-transform", baseTransform);
                    element.style.animation = `sink 0.8s ease-in 0.4s forwards`;
                };
                return this.animate(animationFn);
            }),
        );
    }
}
