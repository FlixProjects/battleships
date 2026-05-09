import { SUPPORTS_CONFIG, TSupportRefNo } from "../../constants";
import { ICellLoc } from "../../types";
import { ISelectable } from "../../types/fe-types";
import { PlayCardActionCreator } from "../ActionCreator";
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
            targetTile?: ICellLoc;
            locationElement?: ISelectable;
            onSuccessCb?: () => void;
        },
    ) {
        super();
    }

    public async execute(params: ICommandExecutionParams): Promise<void> {
        const { cardId, playerId, targetTile, locationElement, onSuccessCb } = this.props;
        const { gsm, db, resolver } = params;

        const card = gsm.gameState.cards.find((c) => c.id === cardId);
        if (!card) {
            throw new Error(`[FEPlaySupportCommand] Card ${cardId} not found`);
        }

        const player = gsm.getPlayer(playerId);
        const supportConfig = SUPPORTS_CONFIG[card.refNo as TSupportRefNo];
        if (!supportConfig) {
            throw new Error(`[FEPlaySupportCommand] No SupportConfig for refNo '${card.refNo}'`);
        }

        const playCardAction = new PlayCardActionCreator(player, gsm.getCurrentRound()).create({
            cardId: card.id,
            commandPointCost: supportConfig.commandPointCost,
            payload: {
                kind: "Support",
                targetCell: targetTile,
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
