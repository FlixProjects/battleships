import { v7 as uuidv7 } from "uuid";
import { IPlayer } from "../types";
import {
    ActionTypes,
    IDeployAction,
    IMoveAction,
    IPlayCardAction,
    IPlayerAction,
    IShipAttackAction,
    TCommitAttackShipParams,
    TCommitDeployShipParams,
    TCommitMoveShipParams,
    TPlayCardPayload,
} from "../types/action-types";

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

export class MoveShipActionCreator extends ActionCreator {
    public create(props: TCommitMoveShipParams): IMoveAction {
        const { shipId, commandPointCost, hullLocations } = props;
        return {
            ...super._create(),
            type: ActionTypes.MOVE,
            shipId,
            hullLocations,
            commandPointCost,
        };
    }
}

export class ShipAttackActionCreator extends ActionCreator {
    public create(props: TCommitAttackShipParams): IShipAttackAction {
        const { attackLocations, shipId, commandPointCost } = props;
        return {
            ...super._create(),
            type: ActionTypes.ATTACK,
            shipId,
            attackLocations,
            commandPointCost,
        };
    }
}

export class PlayCardActionCreator extends ActionCreator {
    public create(props: { cardId: string; commandPointCost: number; payload: TPlayCardPayload }): IPlayCardAction {
        return {
            ...super._create(),
            type: ActionTypes.PLAY_CARD,
            cardId: props.cardId,
            commandPointCost: props.commandPointCost,
            payload: props.payload,
        };
    }
}
