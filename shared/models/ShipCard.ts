import {
    ActionTypes,
    DeployingShipIMEvent,
    ICard,
    IDeployAction,
    IMEventType,
    IShipCardPayload,
    TActionMeta,
    TPlayCardPayload,
} from "../types";
import { Card, ICardSelectionHandlers } from "./Card";

/**
 * Card that triggers an IDeployAction. Its `instanceId` points at the Ship
 * that gets deployed; the payload supplies the hull placements.
 */
export class ShipCard extends Card {
    constructor(props: Readonly<ICard>) {
        super(props);
    }

    public buildAction(meta: TActionMeta, payload: TPlayCardPayload): IDeployAction {
        if (payload.kind !== "Ship") {
            throw new Error(
                `ShipCard ${this.id} received non-Ship payload (kind=${payload.kind}); cannot build deploy action`,
            );
        }
        const shipPayload = payload as IShipCardPayload;
        return {
            ...meta,
            type: ActionTypes.DEPLOY,
            shipId: this.instanceId,
            hullLocations: shipPayload.hullLocations,
        };
    }

    public getSelectionEvent(handlers: ICardSelectionHandlers): DeployingShipIMEvent {
        return {
            type: IMEventType.DEPLOYING_SHIP,
            shipId: this.instanceId,
            ...handlers,
        };
    }
}
