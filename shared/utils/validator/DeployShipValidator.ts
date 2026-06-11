import { ERROR_CODE } from "../../constants";
import { IDeployAction, IErrorResult, IGameState, ResultType } from "../../types";
import { LocationHelper } from "../../utils";
import { computeDeployedHullLocation } from "../hull-helper";
import { Validator } from "./Validator";

export class DeployShipValidator extends Validator {
    constructor(
        private readonly gameState: IGameState,
        private readonly deployAction: IDeployAction,
    ) {
        super();
    }

    validate() {
        try {
            this.validateShipExists();
            this.validateDestinationNotOccupied();

            return { type: ResultType.SUCCESS, playerId: this.deployAction.playerId };
        } catch (error) {
            return error as IErrorResult;
        }
    }

    private validateShipExists() {
        const { shipId } = this.deployAction;
        const ship = this.gameState.ships.find((s) => s.id === shipId);

        if (!ship) {
            throw {
                type: ResultType.ERROR,
                errorCode: ERROR_CODE.SYS_NOT_FOUND,
                message: "Ship not found",
            };
        }
    }

    private validateDestinationNotOccupied() {
        const cells = this.computeDeployHullLocations();
        const locationHelper = new LocationHelper(this.gameState.players);

        if (!locationHelper.hasSpaceForShip(cells)) {
            throw {
                type: ResultType.ERROR,
                errorCode: ERROR_CODE.DEPLOY_ERROR_LOCATION_OCCUPIED,
                message: "Deploy location is occupied",
            };
        }
    }

    private computeDeployHullLocations() {
        const { playerId, shipId, location } = this.deployAction;
        const ship = this.gameState.ships.find((s) => s.id === shipId);
        if (!ship) {
            throw {
                type: ResultType.ERROR,
                errorCode: ERROR_CODE.SYS_NOT_FOUND,
                message: "Ship not found",
            };
        }

        const isFirstPlayer = this.gameState.isFirstPlayer(playerId);
        return ship.hullTemplates.map((ht) =>
            computeDeployedHullLocation(location, ht.templateLocation, isFirstPlayer),
        );
    }
}
