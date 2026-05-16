import { IPlayerAction, TCommitMoveShipParams } from "../../types";
import { MoveShipActionCreator } from "../ActionCreator";
import { IServerCommandEventConsumer, ServerCommand } from "./ServerCommand";
import { ICommandExecutionParams } from "./types";

export class ServerMoveCommand extends ServerCommand {
    constructor(
        consumer: IServerCommandEventConsumer,
        private props: { playerId: string } & TCommitMoveShipParams,
    ) {
        super(consumer);
    }

    protected createAction(params: ICommandExecutionParams): IPlayerAction {
        const { gsm } = params;
        const player = gsm.getPlayer(this.props.playerId);
        return new MoveShipActionCreator(player, gsm.getCurrentRound()).create({
            shipId: this.props.shipId,
            hullLocations: this.props.hullLocations,
            commandPointCost: this.props.commandPointCost,
        });
    }
}
