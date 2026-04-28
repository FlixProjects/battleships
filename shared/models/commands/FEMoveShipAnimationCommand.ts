import { IMoveShipAnimationProps } from "src/types";
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
        const { shipId, playerId, hullMap, startingOrientation } = this.props;
        const { gsm } = params;

        const ship = gsm.getShip(shipId);
        const shipHulls = gsm.getShipHulls(shipId);

        const moveShipAnimation = new MoveShipAnimation({
            shipId,
            startingOrientation,
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
