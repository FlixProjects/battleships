// Re-export from shared so existing relative imports keep working while
// domain classes (e.g. ShipCard) can pull the same shapes from shared/.
export {
    DeployingShipIMEvent,
    IMEvent,
    IMEventType,
    MovingShipIMEvent,
    SelectShipActionIMEvent,
    ShipAttackActionIMEvent,
    TIMEventType,
} from "@shared/types/im-event-types";
