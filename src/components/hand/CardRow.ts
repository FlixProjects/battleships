import { COLOR } from "@shared/constants";
import { GameConfig } from "@shared/index";
import { GameStateManager } from "@shared/models";
import { IAppState } from "@shared/types";
import { gameManager } from "../..";
import { Selectable } from "../Selectable";
import { ShipIcon } from "../ships/ShipIcon";
import { SupportIcon } from "../supports/SupportIcon";

interface Props {
    cardId: string;
    selected: boolean;
    isSelectable?: boolean;
    onSelect?: (cardId: string) => void;
}

/**
 * Renders a single card in the player's hand.
 *
 * Today every card is a Ship card, so the body is a ShipIcon. When other
 * card kinds appear, branch on `card.kind` here (or extract per-kind
 * renderers) — the parent CardSelector stays generic.
 */
export class CardRow extends Selectable {
    constructor(public props: Props) {
        super(props.cardId);
    }

    updateState(_state?: IAppState): void {
        this.remove();
        this.build();
    }

    setSelected(selected: boolean) {
        this.props.selected = selected;
        this.updateStyles();
    }

    build() {
        this.ref = document.createElement("div");
        this.ref.classList.add("card-row");

        this.addStyles();

        this.isSelectable = this.props.isSelectable;
        this.setState();

        this.renderBody();
        return this.ref;
    }

    private renderBody() {
        const gsm = new GameStateManager(gameManager.state.gameState);
        const card = gsm.getCard(this.props.cardId);
        if (!card) return;

        if (card.kind === GameConfig.CardKind.Ship) {
            this.renderShipIcon(card.instanceId, card.refNo, gsm);
            return;
        }
        if (card.kind === GameConfig.CardKind.Support) {
            this.renderSupportIcon(card.id, card.refNo, gsm);
            return;
        }
    }

    private renderSupportIcon(cardId: string, refNo: string, gsm: GameStateManager) {
        const supportIcon = new SupportIcon({
            cardId,
            refNo,
            color: gsm.gameState.getFirstPlayerId() === gameManager.getCurrentPlayerId() ? COLOR.TEAL : COLOR.ORANGE,
        });
        this.addChild(supportIcon);
        this.ref.appendChild(supportIcon.build());
    }

    private renderShipIcon(shipId: string, refNo: string, gsm: GameStateManager) {
        const playerId = gsm.gameState.getShip(shipId)?.playerId;
        const shipIcon = new ShipIcon({
            refNo,
            shipId,
            playerId,
            color: gsm.gameState.getFirstPlayerId() === gameManager.getCurrentPlayerId() ? COLOR.TEAL : COLOR.ORANGE,
        });
        this.addChild(shipIcon);
        this.ref.appendChild(shipIcon.build());
    }

    public onSelectable(): void {
        this.addClickEventListener();
        this.ref.addEventListener("mouseenter", this.mouseEnter);
        this.ref.addEventListener("mouseleave", this.mouseLeave);
    }

    public onUnselectable(): void {
        this.removeClickEventListener();
        this.ref.removeEventListener("mouseenter", this.mouseEnter);
        this.ref.removeEventListener("mouseleave", this.mouseLeave);
    }

    private mouseEnter = () => {
        this.ref.style.transform = "scale(1.1)";
        this.ref.style.borderBottomColor = "rgba(110, 231, 183, 0.9)";
    };

    private mouseLeave = () => {
        this.ref.style.transform = "scale(1)";
        this.ref.style.borderBottomColor = "rgba(110, 231, 183, 0.6)";
    };

    public async onClick(): Promise<void> {
        this.props.onSelect?.(this.props.cardId);
    }

    protected addStyles() {
        this.ref.style.animation = "";
        this.ref.style.display = "flex";
        this.ref.style.alignItems = "center";
        this.ref.style.justifyContent = "space-between";
        this.ref.style.padding = "12px";
        this.ref.style.borderRadius = "8px";
        this.ref.style.cursor = "pointer";

        this.updateStyles();
    }

    private updateStyles() {
        if (this.props.selected) {
            this.ref.style.background = "rgba(110, 231, 183, 0.15)";
            this.ref.style.animation = "pulse 1.5s ease-in-out infinite";
        } else {
            this.ref.style.background = "rgba(255, 255, 255, 0.02)";
            this.ref.style.animation = "";
        }
    }
}
