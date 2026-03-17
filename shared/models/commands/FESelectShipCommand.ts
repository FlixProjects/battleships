import { IGameStateManager } from "../../types";
import { FECommand } from "./FECommand";

export class FESelectShipCommand extends FECommand {
    private playerId: string;
    private shipId: string;

    constructor(playerId: string, shipId: string) {
        super();
        this.playerId = playerId;
        this.shipId = shipId;
    }

    execute(gsm: IGameStateManager): void {}
    undo(gsm: IGameStateManager): void {}
}
