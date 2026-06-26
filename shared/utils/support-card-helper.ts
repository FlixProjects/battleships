import { SupportCard } from "../models/SupportCard";
import { ICard } from "../types";

type SupportCardConstructor = new (props: Readonly<ICard>) => SupportCard;

/**
 * Registry mapping each Support `refNo` to its concrete SupportCard subclass.
 * Concrete cards (FlareCard, InspireCard) register themselves here — mirrors the
 * Effect registry — so new Supports are added by adding a class, not by editing
 * this file. Unregistered refNos fall back to the base SupportCard, which fails
 * loudly only if actually played (it has no effects to create).
 */
const supportCardConstructors = new Map<string, SupportCardConstructor>();

export const registerSupportCard = (refNo: string, ctor: SupportCardConstructor): void => {
    supportCardConstructors.set(refNo, ctor);
};

export const createSupportCard = (props: Readonly<ICard>): SupportCard => {
    const Ctor = supportCardConstructors.get(props.refNo) ?? SupportCard;
    return new Ctor(props);
};
