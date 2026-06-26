import { ASSET_PATHS, COLOR } from "@shared/constants";
import { GameConfig, TCardKind } from "@shared/index";
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
import { SupportCard } from "@shared/models/SupportCard";
import { CardKind } from "@shared/config/constants";

interface Props {
    cardId: string;
    cardType: TCardKind;
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

        if (this.props.cardType === CardKind.Ship) this.ref.classList.add("ship-row");
        if (this.props.cardType === CardKind.Support) this.ref.classList.add("support-row");

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

        // Hovering the left content scales the whole row (tooltip cell included);
        // hovering the tooltip cell transforms just that cell — see buildTooltipCell.
        this.contentWrapper = document.createElement("div");
        this.contentWrapper.style.display = "flex";
        this.contentWrapper.style.alignItems = "center";
        this.contentWrapper.style.gap = "10px";
        this.contentWrapper.style.padding = "12px 0 12px 12px ";

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
        const card = gsm.getCard(cardId);
        const imgSrc = card instanceof SupportCard ? card.imgSrc : undefined;

        const supportIcon = new SupportIcon({
            cardId,
            refNo,
            imgSrc,
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
            ...(ship?.iconImgName ? { imgSrc: `./assets/ships/${ship?.iconImgName}` } : {}),
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
        cell.style.padding = "12px 12px 12px 10px";
        cell.style.paddingRight = "12px";
        cell.style.marginLeft = "8px";
        cell.style.borderLeft = "1px solid rgba(255, 255, 255, 0.12)";
        cell.style.cursor = "pointer";
        cell.style.borderRadius = "0 8px 8px 0";
        cell.style.opacity = "0.9";

        const icon = new Icon({
            src: ASSET_PATHS.INFO_ICON,
            addStyles: (img) => {
                img.ref.style.width = "16px";
                img.ref.style.height = "16px";
            },
        });
        const el = icon.build();

        cell.addEventListener("mouseenter", () => {
            cell.style.transition = "background-color 0.3s ease, opacity 0.3s ease";
            cell.style.background = "rgba(255, 255, 255, 1)";
            el.style.transition = "filter 0.3 ease, opacity 0.3s ease";
            el.style.filter = "brightness(0) invert(0)";
            el.style.opacity = "1";
        });
        cell.addEventListener("mouseleave", () => {
            cell.style.transition = "background-color 0.3s ease, opacity 0.3s ease";
            cell.style.background = "rgba(255, 255, 255, 0)";
            el.style.transition = "filter 0.3 ease, opacity 0.3s ease";
            el.style.filter = "brightness(0) invert(1)";
            el.style.opacity = "1";
        });
        cell.addEventListener("click", (e) => {
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
        this.ref.style.transform = "scale(1.05)";
    };

    private mouseLeave = () => {
        this.ref.style.transform = "scale(1)";
    };

    public async onClick(): Promise<void> {
        this.props.onSelect?.(this.props.cardId);
    }

    protected addStyles() {
        this.ref.style.animation = "";
        this.ref.style.display = "flex";
        this.ref.style.alignItems = "center";
        this.ref.style.justifyContent = "space-between";
        this.ref.style.borderRadius = "8px";
        this.ref.style.cursor = "pointer";
        this.ref.style.transition = "transform 0.2s ease";

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
