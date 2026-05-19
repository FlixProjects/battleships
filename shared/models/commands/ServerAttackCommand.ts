import { IPlayerAction, TCommitAttackShipParams } from "../../types";
import { ShipAttackActionCreator } from "../ActionCreator";
import { ServerCommand } from "./ServerCommand";
import { ICommandExecutionParams } from "./types";

export class ServerAttackCommand extends ServerCommand {
    constructor(private props: { playerId: string } & TCommitAttackShipParams) {
        super();
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
