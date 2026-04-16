import { GAME_BOARD_ID } from "@shared/constants";
import { ICellLoc } from "@shared/index";
import { IMoveShipAnimationProps } from "../../types";
import { BaseAnimation } from "./Animation";
import { MoveAnimation } from "./MoveAnimation";

export class MoveShipAnimation extends BaseAnimation {
    constructor(protected props: IMoveShipAnimationProps) {
        super(props);
    }
    public async execute(): Promise<void> {
        const { hullMap } = this.props;

        const gameBoard = document.getElementById(GAME_BOARD_ID) as HTMLDivElement;
        const _shipElements = Array.from(hullMap.keys()).map((k) => gameBoard.querySelector(`[id='${k}']`));

        const shipElements = _shipElements.map((el) => this.animationLayer.copyToLayer(this.id, el as HTMLElement));

        if (shipElements.length === 0) return;
        // FIXME: ship should rotate as a whole ship, not on its own
        await Promise.all(
            shipElements.map(async (element) => {
                const elementId = element.id;

                const animationFn = async () => {
                    const hullMapValue = hullMap.get(elementId);

                    if (!hullMapValue) {
                        throw new Error(`Hull map is missing elementId ${elementId}`);
                    }

                    const fromCell: ICellLoc = hullMapValue.oldLoc ?? [0, 0];
                    const toCell: ICellLoc = hullMapValue.newLoc ?? [0, 1];

                    const moveAnimation = new MoveAnimation({ element, fromCell, toCell });
                    return await moveAnimation.execute();
                };

                return await this.animate(animationFn);
            }),
        );
    }
}
