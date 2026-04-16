import { MoveShipAnimation } from "../../../src/models/animations/MoveShipAnimation";
import { ICellLoc, INewOldHullLocMap } from "../../types/types";
import { FEAnimationCommand } from "./FEAnimationCommand";
import { ICommandExecutionParams } from "./types";

export class FEMoveShipAnimationCommand extends FEAnimationCommand {
    constructor(
        private props: {
            shipId: string;
            playerId: string;
            toLocation: ICellLoc;
            hullMap: Map<string, INewOldHullLocMap>;
        },
    ) {
        super();
    }
    public async execute(params: ICommandExecutionParams): Promise<void> {
        const { shipId: shipId, playerId, toLocation, hullMap } = this.props;
        const { gsm } = params;

        const ship = gsm.getShip(shipId);
        const shipHulls = gsm.getShipHulls(shipId);

        const moveShipAnimation = new MoveShipAnimation({
            shipId,
            toLocation,
            hullMap,
        });

        this.gameBoard.addToAnimatingMap(shipId, moveShipAnimation.id);
        this.animationManager.enqueue(moveShipAnimation, () => {
            this.gameBoard.removeFromAnimatingMap(shipId);
            this.gameBoard.renderShip(ship, shipHulls, playerId === gsm.gameState.getFirstPlayerId());
        });
        this.animationManager.play();
    }

    public async undo(params: ICommandExecutionParams): Promise<void> {
        // TODO: undo animation
    }
}
