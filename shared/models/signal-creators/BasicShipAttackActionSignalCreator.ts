import { BasicShipAttackSignal } from "@shared/models/signals/BasicShipAttackSignal";
import { ActionTypes, IShipAttackAction } from "@shared/types/action-types";
import { ActionSignalCreator } from "./ActionSignalCreator";

export class BasicShipAttackActionSignalCreator extends ActionSignalCreator {
    createIfValid(action: IShipAttackAction) {
        if (action.type === ActionTypes.ATTACK) {
            return [new BasicShipAttackSignal({ senderId: action.shipId, attackLocations: action.attackLocations })];
        }
        return [];
    }
}
