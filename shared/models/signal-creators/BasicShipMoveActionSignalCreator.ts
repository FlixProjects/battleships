import { BasicShipMoveSignal } from "@shared/models/signals/BasicShipMoveSignal";
import { ActionTypes, IMoveAction } from "@shared/types/action-types";
import { ActionSignalCreator } from "./ActionSignalCreator";

export class BasicShipMoveActionSignalCreator extends ActionSignalCreator {
    createIfValid(action: IMoveAction) {
        if (action.type === ActionTypes.MOVE) {
            const payload = { shipId: action.shipId, targetCell: action.targetCell, route: action.route };
            return [
                new BasicShipMoveSignal({
                    targetId: action.shipId,
                    payload,
                }),
            ];
        }
        return [];
    }
}
