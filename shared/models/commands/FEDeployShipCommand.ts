import { ISelectable } from "../../types/fe-types";
import { getHull, keyToLocation } from "../../utils/helpers";
import { DeployShipActionCreator } from "../ActionCreator";
import { FECommand } from "./FECommand";
import { ICommandExecutionParams } from "./types";

export class FEDeployShipCommand extends FECommand {
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

    execute(params: ICommandExecutionParams): Promise<void> {
        const { tileId, shipId, playerId, locationElement, onSuccessCb } = this.props;
        const { gsm, db, resolver } = params;
        const { commandPointCost, hullTemplates } = gsm.getShip(shipId);
        const player = gsm.getPlayer(playerId);

        // FIXME: only single location for now
        const committedHullLocations = hullTemplates.map((template) => {
            const loc = keyToLocation(tileId);
            return getHull(shipId, template, loc); // we initialise the location here
        });

        const deployAction = new DeployShipActionCreator(player, gsm.getCurrentRound()).create({
            shipId,
            commandPointCost,
            hullLocations: committedHullLocations,
        });

        const newGameState = resolver.resolveDeploy(deployAction);

        db.saveCurrentPlayerStateV2({ gameState: newGameState }, { skipResolve: true });

        locationElement.runOnSelects();
        onSuccessCb?.();
        return;
    }

    undo(params: ICommandExecutionParams): Promise<void> {
        // TODO: implement undo for deploy ship
        return;
    }
}
