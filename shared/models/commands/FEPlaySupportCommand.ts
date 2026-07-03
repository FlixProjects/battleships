import { TSupportSelection } from "../../types";
import { ISelectable } from "../../types/fe-types";
import { SupportCard } from "../SupportCard";
import { FECommand } from "./FECommand";
import { FEFinalizeSelectionCommand } from "./FEFinalizeSelectionCommand";
import { ServerPlayCardCommand } from "./ServerPlayCardCommand";
import { ICommand, ICommandExecutionParams } from "./types";

/**
 * Presentation + dispatch only (decoupling model). Validates the card, then
 * returns the game-logic sibling (`ServerPlayCardCommand` with a Support
 * payload) + UI cleanup. No resolve/persist here.
 */
export class FEPlaySupportCommand extends FECommand {
    constructor(
        private props: {
            cardId: string;
            playerId: string;
            /** Opaque card-specific targeting data, forwarded verbatim into the
             *  Support payload. This command never inspects its fields. */
            selection?: TSupportSelection;
            locationElement?: ISelectable;
            onSuccessCb?: () => void;
        },
    ) {
        super();
    }

    public async execute(params: ICommandExecutionParams): Promise<ICommand[]> {
        const { cardId, playerId, selection, locationElement, onSuccessCb } = this.props;
        const { gsm } = params;

        const card = gsm.gameState.cards.find((c) => c.id === cardId);
        if (!card) {
            throw new Error(`[FEPlaySupportCommand] Card ${cardId} not found`);
        }
        if (!(card instanceof SupportCard)) {
            throw new Error(`[FEPlaySupportCommand] Card ${cardId} is not a SupportCard`);
        }

        return [
            new ServerPlayCardCommand({
                playerId,
                cardId: card.id,
                commandPointCost: card.commandPointCost,
                payload: { kind: "Support", ...selection },
            }),
            new FEFinalizeSelectionCommand({ locationElement, onSuccessCb }),
        ];
    }

    public async undo(params: ICommandExecutionParams): Promise<ICommand[] | void> {
        return;
    }
}
