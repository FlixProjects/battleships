import { GAME_BOARD_ID } from "@shared/constants";
import { IHullBaseAnimationProps } from "../../types";
import { BaseAnimation } from "./Animation";

export class HullBaseAnimation extends BaseAnimation {
    constructor(protected props: IHullBaseAnimationProps) {
        super({ duration: props.duration || 1200 });
        if (!this.props.elements || this.props.elements.length === 0) {
            this.getShipElements();
        }
    }

    protected copyElementsToLayer: () => HTMLElement[] = () => {
        return this.props.elements.map(({ el, rect }) => {
            return this.animationLayer.copyToLayer(this.id, el, rect);
        });
    };

    private getShipElements() {
        const shipId = this.props.id;
        const _shipElements = Array.from(document.getElementById(GAME_BOARD_ID).querySelectorAll("img")).filter((img) =>
            img.alt.includes(shipId),
        );
        this.copyElementsToLayer = () => {
            return _shipElements.map((el) => this.animationLayer.copyToLayer(this.id, el as HTMLElement));
        };
    }
}
