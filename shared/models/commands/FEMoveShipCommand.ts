import { ICellLoc } from "../../types";
import { ISelectable } from "../../types/fe-types";
import { keyToLocation } from "../../utils/helpers";
import { FECommand } from "./FECommand";
import { FEFinalizeSelectionCommand } from "./FEFinalizeSelectionCommand";
import { FEMoveShipAnimationCommand } from "./FEMoveShipAnimationCommand";
import { ServerMoveCommand } from "./ServerMoveCommand";
import { ICommand, ICommandExecutionParams } from "./types";

export class FEMoveShipCommand extends FECommand {
    constructor(
        private props: {
            tileId: string;
            shipId: string;
            playerId: string;
            locationElement: ISelectable;
            onSuccessCb?: () => void;
            route?: ICellLoc[];
        },
    ) {
        super();
    }

    public async execute(params: ICommandExecutionParams): Promise<ICommand[]> {
        const { tileId, shipId, playerId, locationElement, onSuccessCb, route } = this.props;
        const { gsm } = params;
        const ship = gsm.getShip(shipId);

        if (!ship.hulls || ship.hulls.length === 0) {
            throw new Error("[Error] Trying to move a ship with no hulls");
        }

        const hullMap = new Map();
        gsm.getShipHulls(shipId).forEach((h) => {
            hullMap.set(h.id, { oldLoc: h.location, newLoc: [] });
        });
        const startingOrientation = ship.getFrontHull().orientation;

        return [
            new ServerMoveCommand({
                playerId,
                shipId,
                targetCell: keyToLocation(tileId),
                route,
                commandPointCost: ship.movementCommandPointCost,
            }),
            new FEMoveShipAnimationCommand({
                shipId,
                playerId,
                hullMap,
                startingOrientation,
                route,
            }),
            new FEFinalizeSelectionCommand({ locationElement, onSuccessCb }),
        ];
    }

    public async undo(params: ICommandExecutionParams): Promise<ICommand[] | void> {
        // TODO: implement undo for move ship
    }
}
