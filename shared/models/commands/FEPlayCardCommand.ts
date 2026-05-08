import { CardKind } from "../../types";
import { ISelectable } from "../../types/fe-types";
import { FECommand } from "./FECommand";
import { FEDeployShipCommand } from "./FEDeployShipCommand";
import { ICommandExecutionParams } from "./types";

/**
 * Per-card-kind options that the generic FEPlayCardCommand routes through to
 * the kind-specific sub-command. Adding a new card kind means adding a new
 * branch in `execute()` and (optionally) extending this options shape.
 */
export interface IFEPlayCardCommandProps {
    cardId: string;
    playerId: string;
    deploy?: {
        tileId: string;
        locationElement: ISelectable;
    };
    onSuccessCb?: () => void;
}

/**
 * Generic top-level FE command for playing a card. Looks the card up, then
 * dispatches by `card.kind` to the FE command that knows how to compute the
 * card's effect (e.g. `FEDeployShipCommand` for Ship cards). The click
 * handlers depend on this generic command, not on the kind-specific ones —
 * that keeps the card→effect coupling in one place.
 */
export class FEPlayCardCommand extends FECommand {
    constructor(private props: IFEPlayCardCommandProps) {
        super();
    }

    public async execute(params: ICommandExecutionParams): Promise<void> {
        const { gsm } = params;
        const card = gsm.gameState.cards.find((c) => c.id === this.props.cardId);
        if (!card) {
            throw new Error(`[FEPlayCardCommand] Card ${this.props.cardId} not found`);
        }

        switch (card.kind) {
            case CardKind.Ship:
                return this.playShipCard(params);
            default:
                throw new Error(`[FEPlayCardCommand] Unsupported card kind '${card.kind}'`);
        }
    }

    private async playShipCard(params: ICommandExecutionParams): Promise<void> {
        if (!this.props.deploy) {
            throw new Error(`[FEPlayCardCommand] Ship card requires deploy options (tileId, locationElement)`);
        }

        const { gsm } = params;
        const card = gsm.gameState.cards.find((c) => c.id === this.props.cardId);
        if (!card) return;

        const subCommand = new FEDeployShipCommand({
            tileId: this.props.deploy.tileId,
            shipId: card.instanceId,
            playerId: this.props.playerId,
            locationElement: this.props.deploy.locationElement,
            onSuccessCb: this.props.onSuccessCb,
        });
        await subCommand.execute(params);
    }

    public async undo(_params: ICommandExecutionParams): Promise<void> {
        // TODO: undo via the dispatched sub-command once each FE*Command supports undo.
        return;
    }
}
