import { IFECommandExecutionParams } from "../../../src/types/commands/types";
import { FERenderCommand } from "./FERenderCommand";
import { ICommandExecutionParams } from "./types";

export class FERenderShipCommand extends FERenderCommand {
    constructor(private shipId: string) {
        super();
    }

    public async execute(params: IFECommandExecutionParams): Promise<void> {
        const { gsm } = params;
        const feShip = gsm.getShip(this.shipId);

        feShip.render(this.gameBoard);
    }

    public async undo(params: ICommandExecutionParams): Promise<void> {}
}
