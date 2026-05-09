import { Card } from "../models/Card";
import { ShipCard } from "../models/ShipCard";
import { CardKind, ICard, TCardKind } from "../types";

type CardConstructor = new (props: Readonly<ICard>) => Card;

/**
 * Registry mapping each persisted `kind` to its concrete Card subclass. New
 * card kinds (Spell, Effect, …) register themselves here without changing
 * Card itself — keeps the system open for extension, closed for modification.
 */
const cardConstructors: Record<TCardKind, CardConstructor> = {
    [CardKind.Ship]: ShipCard,
};

export const createCard = (props: Readonly<ICard>): Card => {
    const Ctor = cardConstructors[props.kind];
    if (!Ctor) {
        throw new Error(`Unknown card kind '${props.kind}' for card ${props.id}`);
    }
    return new Ctor(props);
};
