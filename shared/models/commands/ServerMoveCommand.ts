import { IPlayerAction, TCommitMoveShipParams } from "../../types";
import { MoveShipActionCreator } from "../ActionCreator";
import { ServerCommand } from "./ServerCommand";
import { ICommandExecutionParams } from "./types";

export class ServerMoveCommand extends ServerCommand {
    constructor(private props: { playerId: string } & TCommitMoveShipParams) {
        super();
    }

    protected createAction(params: ICommandExecutionParams): IPlayerAction {
        const { gsm } = params;
        const player = gsm.getPlayer(this.props.playerId);
        return new MoveShipActionCreator(player, gsm.getCurrentRound()).create({
            shipId: this.props.shipId,
            targetCell: this.props.targetCell,
            route: this.props.route,
            commandPointCost: this.props.commandPointCost,
        });
    }
}
