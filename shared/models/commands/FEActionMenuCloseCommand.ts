import { IActionMenu } from "../../types/fe-types";
import { FECommand } from "./FECommand";

export class FEActionMenuCloseCommand extends FECommand {
    constructor(
        public readonly parentRef: HTMLElement,
        public readonly actionMenu: IActionMenu,
    ) {
        super();
    }

    async execute(): Promise<void> {
        this.actionMenu.close();
    }

    async undo(): Promise<void> {
        this.parentRef?.appendChild(this.actionMenu.build());
    }
}
