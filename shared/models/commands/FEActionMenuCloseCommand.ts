import { IActionMenu, IBaseComponent } from "../../types/fe-types";
import { FECommand } from "./FECommand";

export class FEActionMenuCloseCommand extends FECommand {
    constructor(
        public readonly tileRef: HTMLElement,
        public readonly actionMenu: IActionMenu,
    ) {
        super();
    }

    async execute(): Promise<void> {
        this.actionMenu.close();
    }

    async undo(): Promise<void> {
        this.tileRef.appendChild(this.actionMenu.build());
    }
}
