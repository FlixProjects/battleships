import { IDeckAddToPlayedSignalHandleCtx } from "@shared/types/types";
import { SignalHandler } from "./SignalHandler";

export class DeckAddToPlayedSignalHandler extends SignalHandler {
    handle(ctx: IDeckAddToPlayedSignalHandleCtx) {
        const { gsm, saveNewState } = ctx;
        const { deckId, cardId } = ctx.signal.payload;

        const deck = gsm.getDeck(deckId);
        const card = gsm.getCard(cardId);
        if (!deck || !card) return;

        deck.addToPlayed(card);

        saveNewState(gsm.gameState);
    }
}
