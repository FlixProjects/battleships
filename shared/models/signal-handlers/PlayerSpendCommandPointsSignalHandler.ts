import { IPlayerSpendCommandPointsSignalHandleCtx } from "@shared/types/types";
import { SignalHandler } from "./SignalHandler";

export class PlayerSpendCommandPointsSignalHandler extends SignalHandler {
    handle(ctx: IPlayerSpendCommandPointsSignalHandleCtx) {
        const { gsm, saveNewState } = ctx;
        const { playerId, amount } = ctx.signal.payload;

        const player = gsm.getPlayer(playerId);
        player.spendCommandPoints(amount);
        gsm.updatePlayer(player);

        saveNewState(gsm.gameState);
    }
}
