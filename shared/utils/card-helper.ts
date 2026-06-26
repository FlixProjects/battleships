import { CardKind } from "../config/constants";
import { Card } from "../models/Card";
import { ShipCard } from "../models/ShipCard";
import { ICard } from "../types";
import { createSupportCard } from "./support-card-helper";

/**
 * Hydrate a persisted card into its concrete domain class. Ship cards have a
 * single class; Support cards dispatch by `refNo` through their own registry
 * (FlareCard, InspireCard, …) so new Supports are added without editing here.
 */
export const createCard = (props: Readonly<ICard>): Card => {
    if (props.kind === CardKind.Support) {
        return createSupportCard(props);
    }
    if (props.kind === CardKind.Ship) {
        return new ShipCard(props);
    }
    throw new Error(`Unknown card kind '${props.kind}' for card ${props.id}`);
};
