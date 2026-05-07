import { queueCommand } from "../../../src/utils/game-helper";
import { ICellLoc } from "../../types";
import { ISelectable } from "../../types/fe-types";
import { keyToLocation } from "../../utils/helpers";
import { MoveShipActionCreator } from "../ActionCreator";
import { FECommand } from "./FECommand";
import { FEMoveShipAnimationCommand } from "./FEMoveShipAnimationCommand";
import { ICommandExecutionParams } from "./types";

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

    public async execute(params: ICommandExecutionParams): Promise<void> {
        const { tileId, shipId, playerId, locationElement, onSuccessCb, route } = this.props;
        const { gsm, db, resolver } = params;
        const ship = gsm.getShip(shipId);

        if (!ship.hulls || ship.hulls.length === 0) {
            throw new Error("[Error] Trying to move a ship with no hulls");
        }

        const oldHulls = gsm.getShipHulls(shipId);
        const hullMap = new Map();
        oldHulls.forEach((h) => {
            hullMap.set(h.id, { oldLoc: h.location, newLoc: [] });
        });
        const startingOrientation = ship.getFrontHull().orientation;

        const player = gsm.getPlayer(playerId);

        const newHullLocations = ship.getNewHullLocations(keyToLocation(tileId), route);

        const moveAction = new MoveShipActionCreator(player, gsm.getCurrentRound()).create({
            shipId,
            commandPointCost: ship.movementCommandPointCost,
            hullLocations: newHullLocations,
        });

        // After resolution ============================================================

        const newGameState = resolver.resolveMove(moveAction);

        db.saveCurrentPlayerStateV2({ gameState: newGameState }, { skipResolve: true });

        // Note: do not use the above GSM, use the new game state
        newGameState.getShipHulls(shipId).forEach((h) => {
            const mappedVal = hullMap.get(h.id);
            mappedVal.newLoc = h.location;
            hullMap.set(h.id, mappedVal);
        });

        await queueCommand(
            new FEMoveShipAnimationCommand({
                shipId,
                playerId,
                hullMap,
                startingOrientation,
                route,
            }),
        );

        locationElement.runOnSelects();
        onSuccessCb?.();
        return;
    }

    public async undo(params: ICommandExecutionParams): Promise<void> {
        // TODO: implement undo for move ship
        return;
    }
}
