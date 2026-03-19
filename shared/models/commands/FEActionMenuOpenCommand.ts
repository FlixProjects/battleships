import { IBaseComponent } from "../../types/fe-types";
import { FECommand } from "./FECommand";

export class FEActionMenuOpenCommand extends FECommand {
    constructor(
        public readonly parentRef: HTMLElement,
        public readonly actionMenu: IBaseComponent,
    ) {
        super();
    }

    async execute(): Promise<void> {
        this.parentRef.appendChild(this.actionMenu.build());
    }

    async undo(): Promise<void> {
        if (this.actionMenu.ref.parentElement === this.parentRef) {
            this.parentRef.removeChild(this.actionMenu.ref);
        }
    }
}
