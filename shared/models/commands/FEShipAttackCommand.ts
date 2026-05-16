import { ICellLoc } from "../../types";
import { ISelectable } from "../../types/fe-types";
import { keyToLocation, locationToKey } from "../../utils/helpers";
import { ShipAttackActionCreator } from "../ActionCreator";
import { FECommand } from "./FECommand";
import { FEFinalizeSelectionCommand } from "./FEFinalizeSelectionCommand";
import { FEShipAttackAnimationCommand } from "./FEShipAttackAnimationCommand";
import { ICommand, ICommandExecutionParams } from "./types";

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
        const { gsm, db, resolver } = params;
        const attackingShip = gsm.getShip(shipId);

        const player = gsm.getPlayer(playerId);
        const attackLocation = keyToLocation(tileId);

        const action = new ShipAttackActionCreator(player, db.state.gameState.currentRound).create({
            shipId,
            attackLocations: [attackLocation], // FIXME: only single location for now
            commandPointCost: attackingShip.commandPointCost,
        });

        const newGameState = resolver.resolveAttack(action);

        const shipsHit: Record<string, string[]> = {};
        newGameState.hulls.forEach((hull) => {
            if ([attackLocation].some((loc) => locationToKey(loc) === locationToKey(hull.location))) {
                shipsHit[hull.shipId] = shipsHit[hull.shipId] || [];
                shipsHit[hull.shipId].push(hull.id);
            }
        });

        db.saveAppState({ gameState: newGameState.toPlain() });

        return [
            new FEShipAttackAnimationCommand({
                attackOrigin,
                attackTileId: tileId,
                shipsHit,
            }),
            new FEFinalizeSelectionCommand({ locationElement, onSuccessCb }),
        ];
    }

    async undo(_params: ICommandExecutionParams): Promise<ICommand[] | void> {
        // TODO: implement undo for ship attack
    }
}
