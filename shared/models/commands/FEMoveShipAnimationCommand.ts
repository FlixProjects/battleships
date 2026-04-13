import { MoveShipAnimation } from "../../../src/models/animations/MoveShipAnimation";
import { ICellLoc } from "../../types/types";
import { FEAnimationCommand } from "./FEAnimationCommand";
import { ICommandExecutionParams } from "./types";

export class FEMoveShipAnimationCommand extends FEAnimationCommand {
    constructor(
        private props: {
            shipId: string;
            playerId: string;
            oldLocations: ICellLoc[];
            newLocations: ICellLoc[];
        },
    ) {
        super();
    }
    execute(params: ICommandExecutionParams): Promise<void> {
        const { shipId, playerId, oldLocations, newLocations } = this.props;
        const { gsm } = params;

        const ship = gsm.getShip(shipId);

        const moveShipAnimation = new MoveShipAnimation({
            elementId: shipId,
            fromCell: oldLocations[0],
            toCell: newLocations[0],
        });

        this.gameBoard.addToAnimatingMap(shipId, moveShipAnimation.id);
        this.animationManager.enqueue(moveShipAnimation, () => {
            this.gameBoard.removeFromAnimatingMap(shipId);
            this.gameBoard.renderShip(ship, ship.hulls, playerId === gsm.gameState.getFirstPlayerId());
        });
        this.animationManager.play();

        return;
    }

    undo(params: ICommandExecutionParams): Promise<void> {
        // TODO: undo animation
        return;
    }
}
