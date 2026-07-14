import { Selectable } from "../../components/Selectable";
import { getClickHandler } from "../click-handlers";
import { ClickHandler } from "../click-handlers/ClickHandler";
import { IMEvent, IMEventType, TIMEventType } from "./types";

const AWAITING_CONFIRMATION_EVENTS: TIMEventType[] = [
    IMEventType.PLAY_SUPPORT_TARGET,
    IMEventType.PLAY_SUPPORT_LINE,
    IMEventType.PLAY_SUPPORT_CONFIRM,
];

export class InteractionManager {
    public uiState = "Idle";
    public selectables: Record<string, Selectable> = {};
    private globalClickHandler: (e: MouseEvent) => void;
    private currentHandler?: ClickHandler;
    private interacting = false;
    private awaitingConfirmation = false;
    private awaitingConfirmationListener?: (awaiting: boolean) => void;

    public isInteracting() {
        return this.interacting;
    }

    public isAwaitingConfirmation() {
        return this.awaitingConfirmation;
    }

    public setAwaitingConfirmation(awaiting: boolean) {
        if (this.awaitingConfirmation === awaiting) return;
        this.awaitingConfirmation = awaiting;
        this.awaitingConfirmationListener?.(awaiting);
    }

    /** Single subscriber — each SubmitMoveButton build re-registers itself. */
    public onAwaitingConfirmationChange(listener: (awaiting: boolean) => void) {
        this.awaitingConfirmationListener = listener;
    }

    public clearInteraction() {
        this.removeGlobalClickEventListener();
    }

    public handleEvent<T extends IMEvent>(event: T) {
        this.teardownOutgoingHandler();
        this.removeGlobalClickEventListener();
        const eventHandler: ClickHandler = getClickHandler(event);

        eventHandler.load(this.selectables, () => this.removeGlobalClickEventListener());
        this.currentHandler = eventHandler;

        const { nextClickhandler } = eventHandler.handleEvent(); // any operations to resolve before click
        this.globalClickHandler = nextClickhandler;
        this.addGlobalClickEventListener();
        this.interacting = true;
        this.setAwaitingConfirmation(AWAITING_CONFIRMATION_EVENTS.includes(event.type));

        // FIXME: should reset uiState but we have no use for it now
    }

    public register(selectable: Selectable) {
        this.selectables[selectable.id] = selectable;
    }

    // TODO: check if this is just a band-aid
    // shouldn't the previous ClickHandler.onGlobalDeselect always fire before the next handle
    // experience is that it did not, hence we need this more robust handling
    private teardownOutgoingHandler() {
        // Tear down the OUTGOING interaction first: detaching its global listener
        // (below) never runs its onGlobalDeselect, so a flow that takes over (e.g.
        // opening the DetailsPanel mid-deploy) would otherwise leave the previous
        // flow's cells highlighted / card selected. Capture-then-clear guards against
        // re-entrancy if a deselect callback dispatches another event.
        const outgoing = this.currentHandler;
        this.currentHandler = undefined;
        outgoing?.deselect();
    }

    private addGlobalClickEventListener() {
        document.addEventListener("click", this.globalClickHandler);
    }

    private removeGlobalClickEventListener() {
        document.removeEventListener("click", this.globalClickHandler);
        this.interacting = false;
        this.setAwaitingConfirmation(false);
        // A flow that ends via handleInvalidClick already ran its own deselect; drop
        // the reference so the next handleEvent doesn't fire it a second time.
        this.currentHandler = undefined;
    }
}
