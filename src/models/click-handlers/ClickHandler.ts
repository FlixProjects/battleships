import { updateComponents } from "../../components/component-helper";
import { Selectable } from "../../components/Selectable";
import { IMEvent } from "../interaction-manager/types";

export class ClickHandler {
    protected event?: IMEvent;
    protected removeGlobalClickEventListener: () => void;
    protected selectables: Record<string, Selectable> = {};

    public handleEvent(): { nextClickhandler: (e: MouseEvent) => Promise<void> } {
        return { nextClickhandler: async (e: MouseEvent) => await this.handler(e) };
    }

    protected async handler(e: MouseEvent) {
        // child should implement
    }

    /**
     * Run this interaction's teardown without being the receiver of a click.
     * InteractionManager calls this on the OUTGOING handler when a new interaction
     * takes over, so the prior flow's onGlobalDeselect (unhighlight cells, deselect
     * card, …) still runs even though its global listener is only being detached.
     */
    public deselect() {
        this.event?.onGlobalDeselect?.();
    }

    public load(selectables: Record<string, Selectable>, removeGlobalClickEventListener: () => void) {
        this.selectables = selectables;
        this.removeGlobalClickEventListener = removeGlobalClickEventListener;
        return this;
    }

    protected handleInvalidClick(onInvalidClickCb?: () => void) {
        this.removeGlobalClickEventListener();
        onInvalidClickCb?.();
        return;
    }

    protected clearPriorOnSelects(selectableKeys: string[]) {
        selectableKeys.forEach((index) => {
            this.selectables[index].clearOnSelect();
        });
    }

    protected loadOnSelects(selectableKeys: string[], onDeselect?: () => void) {
        selectableKeys.forEach((index) => {
            this.selectables[index].addOnSelect(() => {
                updateComponents();
                onDeselect?.();
                this.removeGlobalClickEventListener();
            });
        });
    }

    protected addGetIdOfClick = (e: MouseEvent) => {
        const target = e.target as HTMLElement;
        return target.id;
    };

    protected getTileIdAtPoint(e: MouseEvent): string {
        const elements = document.elementsFromPoint(e.clientX, e.clientY);
        return elements.find((el) => el.classList.contains("tile"))?.id ?? "";
    }
}
