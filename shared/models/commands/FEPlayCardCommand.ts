import { CardKind } from "../../config/constants";
import { ICard, TCardKind, TSupportSelection } from "../../types";
import { ISelectable } from "../../types/fe-types";
import { FECommand } from "./FECommand";
import { FEDeployShipCommand } from "./FEDeployShipCommand";
import { FEPlaySupportCommand } from "./FEPlaySupportCommand";
import { ICommand, ICommandExecutionParams } from "./types";

/**
 * Per-card-kind options that the generic FEPlayCardCommand routes through to
 * the kind-specific entry command. A new card kind = a new entry in
 * `CARD_KIND_FACTORIES` — never an edit to `execute()` (C1, OCP).
 */
export interface IFEPlayCardCommandProps {
    cardId: string;
    playerId: string;
    deploy?: {
        tileId: string;
        locationElement: ISelectable;
    };
    support?: {
        /** Opaque card-specific targeting data (e.g. target cell, line
         *  orientation). Forwarded to FEPlaySupportCommand without inspection. */
        selection?: TSupportSelection;
        locationElement?: ISelectable;
    };
    onSuccessCb?: () => void;
}

type CardCommandFactory = (args: { card: ICard; props: IFEPlayCardCommandProps }) => ICommand[];

const CARD_KIND_FACTORIES: Partial<Record<TCardKind, CardCommandFactory>> = {
    [CardKind.Ship]: ({ card, props }) => {
        if (!props.deploy) {
            throw new Error(`[FEPlayCardCommand] Ship card requires deploy options (tileId, locationElement)`);
        }
        return [
            new FEDeployShipCommand({
                tileId: props.deploy.tileId,
                shipId: card.instanceId,
                playerId: props.playerId,
                locationElement: props.deploy.locationElement,
                onSuccessCb: props.onSuccessCb,
            }),
        ];
    },
    [CardKind.Support]: ({ props }) => [
        new FEPlaySupportCommand({
            cardId: props.cardId,
            playerId: props.playerId,
            selection: props.support?.selection,
            locationElement: props.support?.locationElement,
            onSuccessCb: props.onSuccessCb,
        }),
    ],
};

/**
 * Generic top-level command for playing a card. Looks the card up, then
 * dispatches by `card.kind` via the factory map to the kind-specific entry
 * command (which in turn returns its `[Server*Command, …FE siblings]`).
 */
export class FEPlayCardCommand extends FECommand {
    constructor(private props: IFEPlayCardCommandProps) {
        super();
    }

    public async execute(params: ICommandExecutionParams): Promise<ICommand[]> {
        const { gsm } = params;
        const card = gsm.gameState.cards.find((c) => c.id === this.props.cardId);
        if (!card) {
            throw new Error(`[FEPlayCardCommand] Card ${this.props.cardId} not found`);
        }

        const factory = CARD_KIND_FACTORIES[card.kind];
        if (!factory) {
            throw new Error(`[FEPlayCardCommand] Unsupported card kind '${card.kind}'`);
        }

        return factory({ card, props: this.props });
    }

    public async undo(params: ICommandExecutionParams): Promise<ICommand[] | void> {
        // TODO: undo via the dispatched sub-command once each command supports undo.
    }
}
