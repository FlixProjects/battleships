import { IPlayer } from "../types";
import { ActionTypes, IDeployAction, IPlayerAction } from "../types/action-types";
import { v7 as uuidv7 } from "uuid";

type TCommitDeployShipParams = Pick<IDeployAction, "shipId" | "hullLocations" | "commandPointCost">;

class ActionCreator {
    public action: IPlayerAction;

    constructor(
        protected player: Pick<IPlayer, "id" | "pendingActions">,
        protected currentRound: number,
    ) {}

    protected _create() {
        return {
            id: uuidv7(),
            round: this.currentRound,
            order: this.player.pendingActions.length,
            playerId: this.player.id,
        };
    }
}

export class DeployShipActionCreator extends ActionCreator {
    public create(props: TCommitDeployShipParams): IDeployAction {
        const { shipId, commandPointCost, hullLocations } = props;
        return {
            ...super._create(),
            type: ActionTypes.DEPLOY,
            shipId,
            hullLocations,
            commandPointCost,
        };
    }
}
