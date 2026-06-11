import { PlayCardSignal } from "@shared/models/signals/PlayCardSignal";
import { ActionTypes, IPlayCardAction } from "@shared/types/action-types";
import { ActionSignalCreator } from "./ActionSignalCreator";

export class PlayCardActionSignalCreator extends ActionSignalCreator {
    createIfValid(action: IPlayCardAction) {
        if (action.type === ActionTypes.PLAY_CARD) {
            const payload = { playerId: action.playerId, cardPayload: action.payload };
            return [
                new PlayCardSignal({
                    targetId: action.cardId,
                    payload,
                }),
            ];
        }
        return [];
    }
}
