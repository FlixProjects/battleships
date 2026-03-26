import { IShip } from "../../types";
import { IActionMenu } from "../../types/fe-types";
import { FEActionMenuCloseCommand } from "./FEActionMenuCloseCommand";
import { FEActionMenuOpenCommand } from "./FEActionMenuOpenCommand";
import { FECommand } from "./FECommand";
import { ICommandExecutionParams } from "./types";

export class FESelectShipCommand extends FECommand {
    constructor(
        private selectShipComponent: HTMLElement,
        private shipId: string,
        private getActionMenu: (ship: IShip) => IActionMenu,
    ) {
        super();
    }

    async execute(params: ICommandExecutionParams): Promise<void> {
        const { game, gsm } = params;

        const ship = gsm.getShip(this.shipId);

        const feActionMenuOpenCommand = new FEActionMenuOpenCommand(this.selectShipComponent, this.getActionMenu(ship));

        await game.queueCommand(feActionMenuOpenCommand);
    }

    async undo(params: ICommandExecutionParams): Promise<void> {
        const { game, gsm } = params;

        const ship = gsm.getShip(this.shipId);

        const feActionMenuCloseCommand = new FEActionMenuCloseCommand(
            this.selectShipComponent,
            this.getActionMenu(ship),
        );
        await game.queueCommand(feActionMenuCloseCommand);
    }
}
