import { ASSET_PATHS, COLOR } from "@shared/constants";
import { GameConfig } from "@shared/index";
import { TGameStateManagerCtor } from "@shared/types";
import { IAppState, IGameStateManager, IShip } from "@shared/types";
import { gameManager, interactionManager } from "../..";
import { FEGameStateManager } from "../../models/FEGameStateManager";
import { sumShipHealth } from "../../models/details/DetailsViewModel";
import { IMEventType } from "../../models/interaction-manager/types";
import { Selectable } from "../Selectable";
import { Icon } from "../ships/Icon";
import { ShipIcon } from "../ships/ShipIcon";
import { StatBadge } from "../ships/StatBadge";
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
    private GSM: TGameStateManagerCtor = FEGameStateManager;
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
        const gsm = new this.GSM(gameManager.state.gameState);
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

    private renderSupportIcon(cardId: string, refNo: string, gsm: IGameStateManager) {
        const supportIcon = new SupportIcon({
            cardId,
            refNo,
            color: gsm.gameState.getFirstPlayerId() === gameManager.getCurrentPlayerId() ? COLOR.TEAL : COLOR.ORANGE,
        });
        this.addChild(supportIcon);
        this.ref.appendChild(supportIcon.build());

        // Support cards point instanceId at their primary pre-created Effect.
        const card = gsm.getCard(cardId);
        this.ref.appendChild(this.buildTooltipIcon({ effectId: card?.instanceId }));
    }

    private renderShipIcon(shipId: string, refNo: string, gsm: IGameStateManager) {
        const ship = gsm.gameState.ships.find((s) => s.id === shipId);
        const shipIcon = new ShipIcon({
            refNo,
            shipId,
            playerId: ship?.playerId,
            color: gsm.gameState.getFirstPlayerId() === gameManager.getCurrentPlayerId() ? COLOR.TEAL : COLOR.ORANGE,
        });
        this.addChild(shipIcon);
        this.ref.appendChild(shipIcon.build());

        const right = document.createElement("div");
        right.style.display = "flex";
        right.style.alignItems = "center";
        right.style.gap = "10px";
        if (ship) {
            right.appendChild(this.buildShipStats(ship));
        }
        right.appendChild(this.buildTooltipIcon({ shipId }));
        this.ref.appendChild(right);
    }

    /** Name (Health | Attack | Move) shown beside a Ship card. */
    private buildShipStats(ship: IShip): HTMLElement {
        const container = document.createElement("div");
        container.style.display = "flex";
        container.style.alignItems = "center";
        container.style.gap = "8px";

        const stats: Array<{ iconSrc: string; value: string | number }> = [
            { iconSrc: ASSET_PATHS.HEALTH_ICON, value: sumShipHealth(ship) },
            { iconSrc: ASSET_PATHS.TARGET_ICON, value: ship.attackDamage },
            { iconSrc: ASSET_PATHS.MOVE_ICON, value: ship.movementRange },
        ];
        stats.forEach(({ iconSrc, value }) => {
            const badge = new StatBadge({ iconSrc, value });
            this.addChild(badge);
            container.appendChild(badge.build());
        });
        return container;
    }

    /** Info icon that opens the DetailsPanel without selecting the card to play. */
    private buildTooltipIcon(payload: { shipId?: string; effectId?: string }): HTMLElement {
        const icon = new Icon({
            src: ASSET_PATHS.INFO_ICON,
            addStyles: (img) => {
                img.ref.style.width = "16px";
                img.ref.style.height = "16px";
                img.ref.style.opacity = "0.7";
                img.ref.style.cursor = "pointer";
            },
        });
        const el = icon.build();
        el.addEventListener("click", (e) => {
            e.stopPropagation(); // don't trigger the row's card-select
            interactionManager.handleEvent({ type: IMEventType.SHOW_SHIP_DETAILS, ...payload });
        });
        return el;
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
