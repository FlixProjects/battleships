import { GameStateManager } from "@shared/models";
import { ICard, IPlayer } from "@shared/types";
import { gameManager, interactionManager } from "../..";
import { BaseComponent } from "../BaseComponent";
import { getComponents } from "../component-helper";
import { Toast } from "../Toast";
import { CardRow } from "./CardRow";

interface Props {
    isGameOver: boolean;
    player: IPlayer;
}

/**
 * Renders the player's hand and dispatches the appropriate interaction event
 * when a card is selected. Each Card subclass owns its own
 * `getSelectionEvent()` mapping, so adding a new card kind doesn't require a
 * change here — Hand just asks the card what event it produces.
 */
export class Hand extends BaseComponent {
    private selectedCardId?: string;
    private cardRows: CardRow[] = [];

    constructor(private props: Props) {
        super();
    }

    public build() {
        this.ref = document.createElement("div");
        this.addStyles();
        this.renderCards();
        return this.ref;
    }

    private renderCards() {
        const gsm = new GameStateManager(gameManager.state.gameState);
        const cards = gsm.getPlayerHand(this.props.player.id);

        const flagshipShipCard = this.findFlagshipShipCardNotDeployed(cards, gsm);
        const flagshipCardId = flagshipShipCard?.id;
        const hasFlagshipCardInHand = !!flagshipCardId;

        cards.forEach((card) => {
            if (!this.isCardPlayable(card, gsm)) return;

            const isFlagshipCard = card.id === flagshipCardId;
            const selected = hasFlagshipCardInHand ? isFlagshipCard : this.selectedCardId === card.id;
            const onSelect =
                hasFlagshipCardInHand && !isFlagshipCard
                    ? () => Toast.show({ message: "Deploy flagship first!", type: "warning", duration: 3000 })
                    : (cardId: string) => this.dispatchCardSelection(cardId);

            const isSelectable = this.isSelectable(card, gsm);
            const cardRow = new CardRow({ cardId: card.id, selected, isSelectable, onSelect });
            this.cardRows.push(cardRow);
            this.addChild(cardRow);
            this.ref.appendChild(cardRow.build());
        });

        if (hasFlagshipCardInHand) {
            this.dispatchCardSelection(flagshipCardId);
        }
    }

    private isCardPlayable(card: ICard, gsm: GameStateManager): boolean {
        if (card.kind === "Ship") {
            const ship = gsm.gameState.ships.find((s) => s.id === card.instanceId);
            // Only render ship cards whose Ship hasn't been deployed yet.
            // Deployed/destroyed Ships are no longer "in hand" semantically.
            return !!ship && !ship.deployed;
        }
        return true;
    }

    private isSelectable(card: ICard, gsm: GameStateManager): boolean {
        if (this.props.isGameOver) return false;
        if (this.props.player.ready) return false;

        if (card.kind === "Ship") {
            const ship = gsm.gameState.ships.find((s) => s.id === card.instanceId);
            return !!ship && this.props.player.commandPoints >= ship.commandPointCost;
        }
        return true;
    }

    private findFlagshipShipCardNotDeployed(cards: ICard[], gsm: GameStateManager): ICard | undefined {
        return cards.find((c) => {
            if (c.kind !== "Ship") return false;
            const ship = gsm.gameState.ships.find((s) => s.id === c.instanceId);
            return !!ship && ship.isFlagship && !ship.deployed;
        });
    }

    private dispatchCardSelection(cardId: string) {
        const gsm = new GameStateManager(gameManager.state.gameState);
        const card = gsm.getCard(cardId);
        if (!card) return;

        this.selectedCardId = cardId;
        this.cardRows.forEach((row) => row.setSelected(row.props.cardId === cardId));

        const onGlobalDeselect = this.shouldAutoSelectFlagship()
            ? () => {
                  this.autoSelectFlagshipCard();
                  this.clearSelection();
              }
            : () => this.clearSelection();

        interactionManager.handleEvent(card.getSelectionEvent({ onGlobalDeselect }));
    }

    private shouldAutoSelectFlagship(): boolean {
        const gsm = new GameStateManager(gameManager.state.gameState);
        const cards = gsm.getPlayerHand(this.props.player.id);
        return !!this.findFlagshipShipCardNotDeployed(cards, gsm);
    }

    private autoSelectFlagshipCard() {
        const gsm = new GameStateManager(gameManager.state.gameState);
        const cards = gsm.getPlayerHand(this.props.player.id);
        const flagshipCard = this.findFlagshipShipCardNotDeployed(cards, gsm);
        if (!flagshipCard) return;
        this.dispatchCardSelection(flagshipCard.id);
    }

    private clearSelection() {
        this.selectedCardId = undefined;
        this.cardRows.forEach((row) => row.setSelected(false));
        getComponents().div.gameBoard.updateSelectableTiles([]);
    }

    protected addStyles(): void {
        this.ref.style.display = "flex";
        this.ref.style.flexDirection = "column";
    }
}
