import { FEShipEntity } from "../../../src/models/fe-entities/FEShipEntity";
import { FERenderCommand } from "./FERenderCommand";
import { ICommandExecutionParams } from "./types";

export class FERenderShipCommand extends FERenderCommand {
    constructor(private shipId: string) {
        super();
    }

    public async execute(params: ICommandExecutionParams): Promise<void> {
        const { gsm } = params;
        const ship = gsm.getShip(this.shipId);

        const feShip = new FEShipEntity(ship);

        feShip.render(this.gameBoard);
    }

    public async undo(params: ICommandExecutionParams): Promise<void> {}
}
