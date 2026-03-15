import { FECommand } from "./FECommand";

export class FESelectShipCommand extends FECommand {
    private playerId: string;
    private shipId: string;

    constructor(playerId: string, shipId: string) {
        super();
        this.playerId = playerId;
        this.shipId = shipId;
    }

    execute(): void {
        
    }
    undo(): void {
        
    }
}