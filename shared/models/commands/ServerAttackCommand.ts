import { IPlayerAction, TCommitAttackShipParams } from "../../types";
import { ShipAttackActionCreator } from "../ActionCreator";
import { IServerCommandEventConsumer, ServerCommand } from "./ServerCommand";
import { ICommandExecutionParams } from "./types";

export class ServerAttackCommand extends ServerCommand {
    constructor(
        consumer: IServerCommandEventConsumer,
        private props: { playerId: string } & TCommitAttackShipParams,
    ) {
        super(consumer);
    }

    protected createAction(params: ICommandExecutionParams): IPlayerAction {
        const { gsm } = params;
        const player = gsm.getPlayer(this.props.playerId);
        return new ShipAttackActionCreator(player, gsm.getCurrentRound()).create({
            shipId: this.props.shipId,
            attackLocations: this.props.attackLocations,
            commandPointCost: this.props.commandPointCost,
        });
    }
}
