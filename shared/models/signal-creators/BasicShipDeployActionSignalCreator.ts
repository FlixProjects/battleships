import { BasicShipDeploySignal } from "@shared/models/signals/BasicShipDeploySignal";
import { ActionTypes, IDeployAction } from "@shared/types/action-types";
import { ActionSignalCreator } from "./ActionSignalCreator";

export class BasicShipDeployActionSignalCreator extends ActionSignalCreator {
    createIfValid(action: IDeployAction) {
        if (action.type === ActionTypes.DEPLOY) {
            const payload = { shipId: action.shipId, hullLocations: action.hullLocations };
            return [
                new BasicShipDeploySignal({
                    targetId: action.shipId,
                    payload,
                }),
            ];
        }
        return [];
    }
}
