import { Selectable } from "../../components/Selectable";
import { getClickHandler } from "../click-handlers";
import { ClickHandler } from "../click-handlers/ClickHandler";
import { IMEvent } from "./types";

export class InteractionManager {
    public uiState = "Idle";
    public selectables: Record<string, Selectable> = {};
    private globalClickHandler: (e: MouseEvent) => void;

    public handleEvent<T extends IMEvent>(event: T) {
        this.removeGlobalClickEventListener();
        const eventHandler: ClickHandler = getClickHandler(event);

        eventHandler.load(this.selectables, () => this.removeGlobalClickEventListener());

        const { nextClickhandler } = eventHandler.handleEvent(); // any operations to resolve before click
        this.globalClickHandler = nextClickhandler;
        this.addGlobalClickEventListener();

        // FIXME: should reset uiState but we have no use for it now
    }

    public register(selectable: Selectable) {
        this.selectables[selectable.id] = selectable;
    }

    private addGlobalClickEventListener() {
        document.addEventListener("click", this.globalClickHandler);
    }

    private removeGlobalClickEventListener() {
        document.removeEventListener("click", this.globalClickHandler);
    }
}
