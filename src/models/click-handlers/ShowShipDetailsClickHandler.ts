import { COLOR, SELECTABLE_ID } from "@shared/constants";
import { SupportCard } from "@shared/models";
import { ShowShipDetailsIMEvent } from "@shared/types";
import { gameManager } from "../..";
import { getComponents } from "../../components/component-helper";
import { FEGameStateManager } from "../FEGameStateManager";
import { buildEffectDetails, buildShipDetails, DetailsViewModel } from "../details/DetailsViewModel";
import { ClickHandler } from "./ClickHandler";

/**
 * Read-only handler for SHOW_SHIP_DETAILS: builds a DetailsViewModel from live
 * (fog-obscured) local state and slides out the DetailsPanel. A click outside
 * the panel closes it.
 */
export class ShowShipDetailsClickHandler extends ClickHandler {
    constructor(protected event: ShowShipDetailsIMEvent) {
        super();
    }

    public handleEvent() {
        const vm = this.buildViewModel();
        if (vm) {
            getComponents().div.detailsPanel.open(vm);
        }
        return { nextClickhandler: async (e: MouseEvent) => await this.handler(e) };
    }

    private buildViewModel(): DetailsViewModel | undefined {
        const gsm = new FEGameStateManager(gameManager.state.gameState);
        const currentPlayerId = gameManager.getCurrentPlayerId();
        const colorFor = (ownerId: string) => (ownerId === currentPlayerId ? COLOR.TEAL : COLOR.ORANGE);

        if (this.event.shipId) {
            const ship = gsm.gameState.ships.find((s) => s.id === this.event.shipId);
            if (!ship) return undefined;
            return buildShipDetails(ship, colorFor(ship.playerId));
        }

        if (this.event.effectId) {
            const effect = gsm.gameState.effects.find((e) => e.id === this.event.effectId);
            if (!effect) return undefined;
            const card = gsm.gameState.cards.find((c) => c.id === effect.sourceCardId);
            return buildEffectDetails(effect, colorFor(effect.playerId), {
                name: card?.name ?? effect.refNo,
                description: card instanceof SupportCard ? card.description : "",
            });
        }

        return undefined;
    }

    protected async handler(e: MouseEvent) {
        const target = e.target as HTMLElement;
        const insidePanel = target.closest(`#${SELECTABLE_ID.DETAILS_PANEL}`);
        if (insidePanel) return; // clicks inside the panel keep it open

        getComponents().div.detailsPanel.close();
        this.handleInvalidClick(this.event.onGlobalDeselect);
    }
}
