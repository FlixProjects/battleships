import { IPlayerAction, TPlayCardPayload } from "../../types";
import { PlayCardActionCreator } from "../ActionCreator";
import { ServerCommand } from "./ServerCommand";
import { ICommandExecutionParams } from "./types";

export class ServerPlayCardCommand extends ServerCommand {
    constructor(
        private props: { playerId: string; cardId: string; commandPointCost: number; payload: TPlayCardPayload },
    ) {
        super();
    }

    protected createAction(params: ICommandExecutionParams): IPlayerAction {
        const { gsm } = params;
        const player = gsm.getPlayer(this.props.playerId);
        return new PlayCardActionCreator(player, gsm.getCurrentRound()).create({
            cardId: this.props.cardId,
            commandPointCost: this.props.commandPointCost,
            payload: this.props.payload,
        });
    }
}
