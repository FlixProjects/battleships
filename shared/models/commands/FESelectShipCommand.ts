import { IShip } from "../../types";
import { IActionMenu } from "../../types/fe-types";
import { FEActionMenuCloseCommand } from "./FEActionMenuCloseCommand";
import { FEActionMenuOpenCommand } from "./FEActionMenuOpenCommand";
import { FECommand } from "./FECommand";
import { ICommand, ICommandExecutionParams } from "./types";

export class FESelectShipCommand extends FECommand {
    constructor(
        private selectShipComponent: HTMLElement,
        private shipId: string,
        private getActionMenu: (ship: IShip) => IActionMenu,
    ) {
        super();
    }

    async execute(params: ICommandExecutionParams): Promise<ICommand[]> {
        const { gsm } = params;

        const ship = gsm.getShip(this.shipId);

        return [new FEActionMenuOpenCommand(this.selectShipComponent, this.getActionMenu(ship))];
    }

    async undo(params: ICommandExecutionParams): Promise<ICommand[]> {
        const { gsm } = params;

        const ship = gsm.getShip(this.shipId);

        return [new FEActionMenuCloseCommand(this.selectShipComponent, this.getActionMenu(ship))];
    }
}
