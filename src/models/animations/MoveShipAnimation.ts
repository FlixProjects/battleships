import { ANIMATION_LAYER_ID, TILE_GAP_PX, TILE_SIZE_PX } from "../../../shared";
import { IMoveAnimationProps } from "../../types";
import { MoveAnimation } from "./MoveAnimation";

export class MoveShipAnimation extends MoveAnimation {
    constructor(protected props: IMoveAnimationProps) {
        super(props);
    }
    public async execute(): Promise<void> {
        // TODO: we should pass in the elements to animate instead of querying the DOM

        const animationLayer = document.getElementById(ANIMATION_LAYER_ID);
        if (!animationLayer) return;

        const shipId = this.props.id;

        const shipElements = Array.from(animationLayer.querySelectorAll("img")).filter((img) =>
            img.alt.includes(shipId),
        );

        if (shipElements.length === 0) return;

        const [fromCol, fromRow] = this.props.fromCell;
        const [toCol, toRow] = this.props.toCell;

        const deltaX = (toCol - fromCol) * (TILE_SIZE_PX + TILE_GAP_PX);
        const deltaY = (toRow - fromRow) * (TILE_SIZE_PX + TILE_GAP_PX);

        await Promise.all(
            shipElements.map((element) => {
                const animationFn = () => {
                    this.moveElement(element, deltaX, deltaY);
                };
                return this.animate(animationFn);
            }),
        );
    }
}
