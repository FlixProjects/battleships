import { TPlayCardPayload } from "../../types";
import { ISelectable } from "../../types/fe-types";
import { FECommand } from "./FECommand";
import { FEFinalizeSelectionCommand } from "./FEFinalizeSelectionCommand";
import { ServerPlayCardCommand } from "./ServerPlayCardCommand";
import { ICommand, ICommandExecutionParams } from "./types";

export interface IFEPlayCardCommandProps {
    cardId: string;
    playerId: string;
    /** Card-specific play params (targeting, deploy anchor, …), forwarded
     *  verbatim as the ServerPlayCardCommand payload — never inspected here.
     *  The card itself validates the payload kind when it resolves. */
    loadPlayParams: TPlayCardPayload;
    locationElement?: ISelectable;
    onSuccessCb?: () => void;
}

/**
 * Generic top-level command for playing any card. Presentation + dispatch only:
 * looks the card up (for its CP cost), then returns the game-logic sibling
 * (`ServerPlayCardCommand` carrying the opaque payload) + UI cleanup.
 */
export class FEPlayCardCommand extends FECommand {
    constructor(private props: IFEPlayCardCommandProps) {
        super();
    }

    public async execute(params: ICommandExecutionParams): Promise<ICommand[]> {
        const { cardId, playerId, loadPlayParams, locationElement, onSuccessCb } = this.props;
        const { gsm } = params;

        const card = gsm.gameState.cards.find((c) => c.id === cardId);
        if (!card) {
            throw new Error(`[FEPlayCardCommand] Card ${cardId} not found`);
        }

        return [
            new ServerPlayCardCommand({
                playerId,
                cardId,
                commandPointCost: card.getCommandPointCost(gsm),
                payload: loadPlayParams,
            }),
            new FEFinalizeSelectionCommand({ locationElement, onSuccessCb }),
        ];
    }

    public async undo(params: ICommandExecutionParams): Promise<ICommand[] | void> {
        // TODO: undo once ServerPlayCardCommand supports it.
    }
}
