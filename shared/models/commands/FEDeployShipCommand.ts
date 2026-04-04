import { IHullCalculator, THullCalculatorConstructor } from "@shared/types";
import { HullCalculator as _HullCalculator } from "@shared/utils/hull-helper";
import { ISelectable } from "../../types/fe-types";
import { getHull, keyToLocation } from "../../utils/helpers";
import { DeployShipActionCreator } from "../ActionCreator";
import { FECommand } from "./FECommand";
import { ICommandExecutionParams } from "./types";

export class FEDeployShipCommand extends FECommand {
    private HullCalculator: THullCalculatorConstructor = _HullCalculator;

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

    public async execute(params: ICommandExecutionParams): Promise<void> {
        const { tileId, shipId, playerId, locationElement, onSuccessCb } = this.props;
        const { gsm, db, resolver } = params;
        const { commandPointCost, hullTemplates } = gsm.getShip(shipId)!;

        const player = gsm.getPlayer(playerId);
        const isFirstPlayer = gsm.gameState.isFirstPlayer(playerId);

        const selectedLocation = keyToLocation(tileId);
        const hullCalculator: IHullCalculator = new this.HullCalculator(gsm, isFirstPlayer);

        const committedHullLocations = hullTemplates.map((ht) => {
            const deployedLoc = hullCalculator.getDeployedHullLocation(selectedLocation, ht.templateLocation);
            return getHull(shipId, ht, deployedLoc);
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

    public async undo(params: ICommandExecutionParams): Promise<void> {
        // TODO: implement undo for deploy ship
        return;
    }
}
