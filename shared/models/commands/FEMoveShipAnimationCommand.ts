import { IMoveShipAnimationProps } from "../../../src/types";
import { MoveShipAnimation } from "../../../src/models/animations/MoveShipAnimation";
import { FEAnimationCommand } from "./FEAnimationCommand";
import { ICommandExecutionParams } from "./types";

interface IFEAnimationCommandProps extends IMoveShipAnimationProps {
    playerId: string;
}

export class FEMoveShipAnimationCommand extends FEAnimationCommand {
    constructor(private props: IFEAnimationCommandProps) {
        super();
    }
    public async execute(params: ICommandExecutionParams): Promise<void> {
        const { shipId, playerId, hullMap, startingOrientation, route } = this.props;
        const { gsm } = params;

        const ship = gsm.getShip(shipId);
        const shipHulls = gsm.getShipHulls(shipId);

        // Fill newLoc from post-save state (the ServerMoveCommand sibling has
        // already resolved + persisted). Reads the *actual* outcome, so a
        // silently-failed move animates old==new (no spurious movement).
        shipHulls.forEach((h) => {
            const mapped = hullMap.get(h.id);
            if (mapped) {
                mapped.newLoc = h.location;
            }
        });

        const moveShipAnimation = new MoveShipAnimation({
            shipId,
            startingOrientation,
            hullMap,
            route,
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
