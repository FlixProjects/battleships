import { IPlayerRemoveCardFromHandSignalHandleCtx } from "@shared/types/types";
import { SignalHandler } from "./SignalHandler";

export class PlayerRemoveCardFromHandSignalHandler extends SignalHandler {
    handle(ctx: IPlayerRemoveCardFromHandSignalHandleCtx) {
        const { gsm, saveNewState } = ctx;
        const { playerId, cardId } = ctx.signal.payload;

        const player = gsm.getPlayer(playerId);
        player.removeCardFromHand(cardId);
        gsm.updatePlayer(player);

        saveNewState(gsm.gameState);
    }
}
