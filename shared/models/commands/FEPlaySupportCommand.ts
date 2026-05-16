import { ICellLoc } from "../../types";
import { ISelectable } from "../../types/fe-types";
import { PlayCardActionCreator } from "../ActionCreator";
import { SupportCard } from "../SupportCard";
import { FECommand } from "./FECommand";
import { ICommandExecutionParams } from "./types";

/**
 * Mirrors `FEDeployShipCommand` — builds
 * a `PlayCardAction` with a Support payload
 */
export class FEPlaySupportCommand extends FECommand {
    constructor(
        private props: {
            cardId: string;
            playerId: string;
            targetCell?: ICellLoc;
            locationElement?: ISelectable;
            onSuccessCb?: () => void;
        },
    ) {
        super();
    }

    public async execute(params: ICommandExecutionParams): Promise<void> {
        const { cardId, playerId, targetCell, locationElement, onSuccessCb } = this.props;
        const { gsm, db, resolver } = params;

        const card = gsm.gameState.cards.find((c) => c.id === cardId);
        if (!card) {
            throw new Error(`[FEPlaySupportCommand] Card ${cardId} not found`);
        }
        if (!(card instanceof SupportCard)) {
            throw new Error(`[FEPlaySupportCommand] Card ${cardId} is not a SupportCard`);
        }

        const player = gsm.getPlayer(playerId);

        const playCardAction = new PlayCardActionCreator(player, gsm.getCurrentRound()).create({
            cardId: card.id,
            commandPointCost: card.commandPointCost,
            payload: {
                kind: "Support",
                targetCell,
            },
        });

        const newGameState = resolver.resolvePlayCard(playCardAction);

        db.saveAppState({ gameState: newGameState.toPlain() });

        locationElement?.runOnSelects();
        onSuccessCb?.();
    }

    public async undo(_params: ICommandExecutionParams): Promise<void> {
        return;
    }
}
