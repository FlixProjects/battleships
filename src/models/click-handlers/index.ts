import { IMEvent, IMEventType, TIMEventType } from "../interaction-manager/types";
import type { ClickHandler } from "./ClickHandler";
import { ConfirmEffectClickHandler } from "./ConfirmEffectClickHandler";
import { DeployShipClickHandler } from "./DeployShipClickHandler";
import { MoveShipClickHandler } from "./MoveShipClickHandler";
import { SelectLineTargetClickHandler } from "./SelectLineTargetClickHandler";
import { SelectShipClickHandler } from "./SelectShipClickHandler";
import { SelectTargetClickHandler } from "./SelectTargetClickHandler";
import { ShipAttackClickHandler } from "./ShipAttackClickHandler";
import { ShowShipDetailsClickHandler } from "./ShowShipDetailsClickHandler";

// FIXME: fix typing
const clickHandlerMap: Record<TIMEventType, new (event: never) => ClickHandler> = {
    [IMEventType.DEPLOYING_SHIP]: DeployShipClickHandler,
    [IMEventType.MOVING_SHIP]: MoveShipClickHandler,
    [IMEventType.SELECT_SHIP]: SelectShipClickHandler,
    [IMEventType.SHIP_ATTACK]: ShipAttackClickHandler,
    [IMEventType.PLAY_SUPPORT_TARGET]: SelectTargetClickHandler,
    [IMEventType.PLAY_SUPPORT_LINE]: SelectLineTargetClickHandler,
    [IMEventType.PLAY_SUPPORT_CONFIRM]: ConfirmEffectClickHandler,
    [IMEventType.SHOW_SHIP_DETAILS]: ShowShipDetailsClickHandler,
};
export const getClickHandler = (event: IMEvent): ClickHandler => {
    const HandlerClass = clickHandlerMap[event.type];
    if (!HandlerClass) {
        throw new Error(`No click handler found for event type: ${event.type}`);
    }

    return new HandlerClass(event as never);
};
