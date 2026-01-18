import { GAME_BOARD_ID, TILE_GAP_PX, TILE_SIZE_PX } from "../../../shared";
import { IMoveAnimationProps } from "../../types";
import { MoveAnimation } from "./MoveAnimation";

export class MoveShipAnimation extends MoveAnimation {
    constructor(protected props: IMoveAnimationProps) {
        super(props);
    }
    public async execute(): Promise<void> {
        const shipId = this.props.id;
        const _shipElements = Array.from(document.getElementById(GAME_BOARD_ID).querySelectorAll("img")).filter((img) =>
            img.alt.includes(shipId),
        );
        const shipElements = _shipElements.map((el) => this.animationLayer.copyToLayer(this.id, el as HTMLElement));
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
