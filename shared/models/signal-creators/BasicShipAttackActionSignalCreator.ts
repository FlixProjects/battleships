import type { Action } from "@shared/models/actions/Action";
import { BasicShipAttackSignal } from "@shared/models/signals/BasicShipAttackSignal";
import { ActionTypes } from "@shared/types/action-types";
import { ActionSignalCreator } from "./ActionSignalCreator";

export class BasicShipAttackActionSignalCreator extends ActionSignalCreator {
    createIfValid(action: Action) {
        if (action.type === ActionTypes.ATTACK) {
            return [new BasicShipAttackSignal()];
        }
        return [];
    }
}
