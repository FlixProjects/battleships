import { queueCommand } from "../../../src/utils/game-helper";
import { ISelectable } from "../../types/fe-types";
import { keyToLocation } from "../../utils/helpers";
import { MoveShipActionCreator } from "../ActionCreator";
import { FECommand } from "./FECommand";
import { FEMoveShipAnimation } from "./FEMoveShipAnimationCommand";
import { ICommandExecutionParams } from "./types";

export class FEMoveShipCommand extends FECommand {
    constructor(
        private props: {
            tileId: string;
            shipId: string;
            playerId: string;
            locationElement: ISelectable;
            onSuccessCb?: () => void;
        },
    ) {
        super();
    }

    async execute(params: ICommandExecutionParams): Promise<void> {
        const { tileId, shipId, playerId, locationElement, onSuccessCb } = this.props;
        const { gsm, db, resolver } = params;
        const ship = gsm.getShip(shipId);
        const oldLocations = [...ship.hulls];
        
        const player = gsm.getPlayer(playerId);

        const newHullLocations = ship.getNewHullLocations(keyToLocation(tileId));
        
        const moveAction = new MoveShipActionCreator(player, gsm.getCurrentRound()).create({
            shipId,
            commandPointCost: ship.movementCommandPointCost,
            hullLocations: newHullLocations,
        });

        const newGameState = resolver.resolveMove(moveAction);

        db.saveCurrentPlayerStateV2({ gameState: newGameState }, { skipResolve: true });

        await queueCommand(
            new FEMoveShipAnimation({
                shipId,
                playerId,
                oldLocations: oldLocations.map((h) => h.location),
                newLocations: newHullLocations.map((h) => h.location),
            }),
        );

        locationElement.runOnSelects();
        onSuccessCb?.();
        return;
    }

    undo(params: ICommandExecutionParams): Promise<void> {
        // TODO: implement undo for move ship
        return;
    }
}
