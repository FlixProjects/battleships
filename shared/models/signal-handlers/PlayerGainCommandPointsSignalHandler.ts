import { IPlayerGainCommandPointsSignalHandleCtx } from "@shared/types/types";
import { SignalHandler } from "./SignalHandler";

export class PlayerGainCommandPointsSignalHandler extends SignalHandler {
    handle(ctx: IPlayerGainCommandPointsSignalHandleCtx) {
        const { gsm, saveNewState } = ctx;
        const { playerId, amount } = ctx.signal.payload;

        const player = gsm.getPlayer(playerId);
        player.gainCommandPoints(amount);
        gsm.updatePlayer(player);

        saveNewState(gsm.gameState);
    }
}
