import { IPlayCardSignalHandleCtx } from "@shared/types/types";
import { SignalHandler } from "./SignalHandler";

export class PlayCardSignalHandler extends SignalHandler {
    handle(ctx: IPlayCardSignalHandleCtx) {
        const { gsm, saveNewState, signal } = ctx;

        const card = gsm.getCard(signal.targetId ?? "");
        if (!card) return;

        const newState = card.play(ctx);

        saveNewState(newState);
    }
}
