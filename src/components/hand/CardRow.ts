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
    private contentWrapper?: HTMLElement;
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
        this.renderBody();

        this.isSelectable = this.props.isSelectable;
        this.setState();

        return this.ref;
    }

    private renderBody() {
        const gsm = new this.GSM(gameManager.state.gameState);
        const card = gsm.getCard(this.props.cardId);
        if (!card) return;

        // Left content scales on hover; the tooltip sits past a divider on the
        // right and highlights on its own — hovering it does not scale the row.
        this.contentWrapper = document.createElement("div");
        this.contentWrapper.style.display = "flex";
        this.contentWrapper.style.alignItems = "center";
        this.contentWrapper.style.gap = "10px";
        this.contentWrapper.style.transition = "transform 0.2s ease";
        this.contentWrapper.style.transformOrigin = "left center";

        let tooltipPayload: { shipId?: string; effectId?: string } = {};
        if (card.kind === GameConfig.CardKind.Ship) {
            this.renderShipContent(card.instanceId, card.refNo, gsm);
            tooltipPayload = { shipId: card.instanceId };
        } else if (card.kind === GameConfig.CardKind.Support) {
            this.renderSupportContent(card.id, card.refNo, gsm);
            // Support cards point instanceId at their primary pre-created Effect.
            tooltipPayload = { effectId: card.instanceId };
        } else {
            return;
        }

        this.ref.appendChild(this.contentWrapper);
        this.ref.appendChild(this.buildTooltipCell(tooltipPayload));
    }

    private renderSupportContent(cardId: string, refNo: string, gsm: IGameStateManager) {
        const supportIcon = new SupportIcon({
            cardId,
            refNo,
            color: gsm.gameState.getFirstPlayerId() === gameManager.getCurrentPlayerId() ? COLOR.TEAL : COLOR.ORANGE,
        });
        this.addChild(supportIcon);
        this.contentWrapper?.appendChild(supportIcon.build());
    }

    private renderShipContent(shipId: string, refNo: string, gsm: IGameStateManager) {
        const ship = gsm.gameState.ships.find((s) => s.id === shipId);
        const shipIcon = new ShipIcon({
            refNo,
            shipId,
            playerId: ship?.playerId,
            color: gsm.gameState.getFirstPlayerId() === gameManager.getCurrentPlayerId() ? COLOR.TEAL : COLOR.ORANGE,
        });
        this.addChild(shipIcon);
        this.contentWrapper?.appendChild(shipIcon.build());

        if (ship) {
            this.contentWrapper?.appendChild(this.buildShipStats(ship));
        }
    }

    /** (Health | Attack | Move) shown beside a Ship card. */
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

    /** Divider + info icon that opens the DetailsPanel without selecting the card. */
    private buildTooltipCell(payload: { shipId?: string; effectId?: string }): HTMLElement {
        const cell = document.createElement("div");
        cell.style.display = "flex";
        cell.style.alignItems = "center";
        cell.style.alignSelf = "stretch";
        cell.style.paddingLeft = "10px";
        cell.style.marginLeft = "8px";
        cell.style.borderLeft = "1px solid rgba(255, 255, 255, 0.12)";

        const icon = new Icon({
            src: ASSET_PATHS.INFO_ICON,
            addStyles: (img) => {
                img.ref.style.width = "16px";
                img.ref.style.height = "16px";
                img.ref.style.opacity = "0.6";
                img.ref.style.cursor = "pointer";
                img.ref.style.transition = "opacity 0.15s ease, transform 0.15s ease";
            },
        });
        const el = icon.build();
        el.addEventListener("mouseenter", () => {
            el.style.opacity = "1";
            el.style.transform = "scale(1.2)";
        });
        el.addEventListener("mouseleave", () => {
            el.style.opacity = "0.6";
            el.style.transform = "scale(1)";
        });
        el.addEventListener("click", (e) => {
            e.stopPropagation(); // don't trigger the row's card-select
            interactionManager.handleEvent({ type: IMEventType.SHOW_SHIP_DETAILS, ...payload });
        });

        cell.appendChild(el);
        return cell;
    }

    public onSelectable(): void {
        this.addClickEventListener();
        this.contentWrapper?.addEventListener("mouseenter", this.mouseEnter);
        this.contentWrapper?.addEventListener("mouseleave", this.mouseLeave);
    }

    public onUnselectable(): void {
        this.removeClickEventListener();
        this.contentWrapper?.removeEventListener("mouseenter", this.mouseEnter);
        this.contentWrapper?.removeEventListener("mouseleave", this.mouseLeave);
    }

    private mouseEnter = () => {
        if (this.contentWrapper) this.contentWrapper.style.transform = "scale(1.08)";
    };

    private mouseLeave = () => {
        if (this.contentWrapper) this.contentWrapper.style.transform = "scale(1)";
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
