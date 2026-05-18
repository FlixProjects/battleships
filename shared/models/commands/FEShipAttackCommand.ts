import { ICellLoc } from "../../types";
import { ISelectable } from "../../types/fe-types";
import { keyToLocation } from "../../utils/helpers";
import { FECommand } from "./FECommand";
import { FEFinalizeSelectionCommand } from "./FEFinalizeSelectionCommand";
import { FEShipAttackAnimationCommand } from "./FEShipAttackAnimationCommand";
import { ServerAttackCommand } from "./ServerAttackCommand";
import { ICommand, ICommandExecutionParams } from "./types";

/**
 * Presentation + dispatch only (decoupling model). Returns the game-logic
 * sibling (`ServerAttackCommand`) plus the attack animation (which derives
 * `shipsHit` from post-save state) and the UI-cleanup command.
 */
export class FEShipAttackCommand extends FECommand {
    constructor(
        private props: {
            tileId: string;
            shipId: string;
            playerId: string;
            locationElement: ISelectable;
            attackOrigin: ICellLoc;
            onSuccessCb?: () => void;
        },
    ) {
        super();
    }

    async execute(params: ICommandExecutionParams): Promise<ICommand[]> {
        const { tileId, shipId, playerId, locationElement, attackOrigin, onSuccessCb } = this.props;
        const { gsm } = params;
        const attackingShip = gsm.getShip(shipId);
        const attackLocation = keyToLocation(tileId);

        return [
            new ServerAttackCommand({
                playerId,
                shipId,
                attackLocations: [attackLocation], // FIXME: only single location for now
                commandPointCost: attackingShip.commandPointCost,
            }),
            new FEShipAttackAnimationCommand({ attackOrigin, attackTileId: tileId }),
            new FEFinalizeSelectionCommand({ locationElement, onSuccessCb }),
        ];
    }

    async undo(params: ICommandExecutionParams): Promise<ICommand[] | void> {
        // TODO: implement undo for ship attack
    }
}
