import { IBoardDimensions, ICellLoc } from "@shared/types";
import { interactionManager } from "../..";
import { PathMenu } from "../../components/path-menu/PathMenu";
import { PathOverlay } from "../../components/path-menu/PathOverlay";

interface ISelectRouteEvent {
    routes: ICellLoc[][];
    onConfirm: (selectedRoute: ICellLoc[]) => Promise<void> | void;
    onBack: () => void;
    onDismiss: () => void;
    boardConfig: IBoardDimensions;
}

export class SelectRouteClickHandler {
    private pathMenu?: PathMenu;
    private pathOverlay: PathOverlay;
    private currentIndex = 0;

    constructor(private event: ISelectRouteEvent) {
        this.pathOverlay = new PathOverlay({ boardConfig: event.boardConfig });
    }

    public start() {
        if (this.event.routes.length === 0) {
            this.event.onDismiss();
            return;
        }

        // Runs outside the InteractionManager's click-handler dispatch, so mark
        // the confirm-pending state (which locks submit) explicitly.
        interactionManager.setAwaitingConfirmation(true);
        this.pathOverlay.draw(this.event.routes[this.currentIndex]);

        this.pathMenu = new PathMenu({
            paths: this.event.routes,
            initialIndex: this.currentIndex,
            onCycle: (index) => {
                this.currentIndex = index;
                this.pathOverlay.draw(this.event.routes[this.currentIndex]);
            },
            onConfirm: async () => {
                const selected = this.event.routes[this.currentIndex];
                this.cleanup();
                await this.event.onConfirm(selected);
            },
            onBack: () => {
                this.cleanup();
                this.event.onBack();
            },
            onDismiss: () => {
                this.cleanup();
                this.event.onDismiss();
            },
        });

        this.pathMenu.build();
        document.body.appendChild(this.pathMenu.ref);
    }

    private cleanup() {
        interactionManager.setAwaitingConfirmation(false);
        this.pathMenu?.close();
        this.pathOverlay.clear();
    }
}
