import { BasicShipAttackSignal } from "@shared/models/signals/BasicShipAttackSignal";
import { ActionTypes, IShipAttackAction } from "@shared/types/action-types";
import { ActionSignalCreator } from "./ActionSignalCreator";

export class BasicShipAttackActionSignalCreator extends ActionSignalCreator {
    createIfValid(action: IShipAttackAction) {
        if (action.type === ActionTypes.ATTACK) {
            const payload = { attackingShipId: action.shipId, attackLocations: action.attackLocations };
            return [
                new BasicShipAttackSignal({
                    senderId: action.shipId,
                    targetId: action.shipId,
                    payload,
                }),
            ];
        }
        return [];
    }
}
