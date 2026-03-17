import { IBaseComponent } from "../../types/fe-types";
import { FECommand } from "./FECommand";

export class FEActionMenuOpenCommand extends FECommand {
    constructor(
        public readonly tileRef: HTMLElement,
        public readonly actionMenu: IBaseComponent,
    ) {
        super();
    }

    async execute(): Promise<void> {
        this.tileRef.appendChild(this.actionMenu.build());
    }

    async undo(): Promise<void> {
        if (this.actionMenu.ref.parentElement === this.tileRef) {
            this.tileRef.removeChild(this.actionMenu.ref);
        }
    }
}
