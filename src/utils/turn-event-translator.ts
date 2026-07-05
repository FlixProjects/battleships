import { FECommand } from "@shared/models/commands/FECommand";
import { FEEffectDetonationAnimationCommand } from "@shared/models/commands/FEEffectDetonationAnimationCommand";
import { FEPlaybackAnimationCommand } from "@shared/models/commands/FEPlaybackAnimationCommand";
import { FEPlaybackMoveShipCommand } from "@shared/models/commands/FEPlaybackMoveShipCommand";
import { INewOldHullLocMap, IShipMovedEvent, ITurnEvent, TurnEventKind } from "@shared/types";
import { DestroyedAnimation } from "../models/animations";
import { HitAnimation } from "../models/animations/HitAnimation";
import { getElementsFromIds } from "./game-helper";

/**
 * Maps one recorded `ITurnEvent` to the `FECommand` that animates it, or
 * undefined when the event has no animation of its own (a deploy pops in with
 * the runner's post-event render; card plays aren't animated in v1).
 */
export const turnEventToCommand = (event: ITurnEvent): FECommand | undefined => {
    switch (event.kind) {
        case TurnEventKind.ShipMoved:
            return new FEPlaybackMoveShipCommand({
                shipId: event.shipId,
                startingOrientation: event.startingOrientation,
                hullMap: toHullMap(event),
                route: event.route,
            });
        case TurnEventKind.HullDamaged:
            return new FEPlaybackAnimationCommand(
                () => new HitAnimation({ id: event.shipId, elements: getElementsFromIds([event.hullId]) }),
            );
        case TurnEventKind.ShipDestroyed:
            return new FEPlaybackAnimationCommand(
                () => new DestroyedAnimation({ id: event.shipId, elements: getElementsFromIds(event.hullIds) }),
            );
        case TurnEventKind.EffectDetonated:
            return new FEEffectDetonationAnimationCommand({ location: event.location });
        case TurnEventKind.ShipDeployed:
        case TurnEventKind.CardPlayed:
            return undefined;
    }
};

const toHullMap = (event: IShipMovedEvent): Map<string, INewOldHullLocMap> => {
    const hullMap = new Map<string, INewOldHullLocMap>();
    event.hulls.forEach((segment) => {
        hullMap.set(segment.hullId, { oldLoc: segment.from, newLoc: segment.to ?? segment.from });
    });
    return hullMap;
};
