import { FECommand } from "@shared/models/commands/FECommand";
import { FEEffectDetonationAnimationCommand } from "@shared/models/commands/FEEffectDetonationAnimationCommand";
import { FEPlaybackAnimationCommand } from "@shared/models/commands/FEPlaybackAnimationCommand";
import { FEPlaybackMoveShipCommand } from "@shared/models/commands/FEPlaybackMoveShipCommand";
import { INewOldHullLocMap, IShipMovedEvent, ITurnEvent, TurnEventKind } from "@shared/types";
import { Projectile } from "../components/projectiles/Projectile";
import { DestroyedAnimation } from "../models/animations";
import { HitAnimation } from "../models/animations/HitAnimation";
import { getElementsFromIds } from "./game-helper";

export const turnEventToCommand = (event: ITurnEvent): FECommand | undefined => {
    switch (event.kind) {
        case TurnEventKind.ShipMoved:
            return new FEPlaybackMoveShipCommand({
                shipId: event.shipId,
                startingOrientation: event.startingOrientation,
                hullMap: toHullMap(event),
                route: event.route,
            });
        case TurnEventKind.ShipAttacked:
            return new FEPlaybackAnimationCommand(() =>
                event.targetLocations.map((target) =>
                    new Projectile({ origin: event.origin, target }).createAnimation(),
                ),
            );
        case TurnEventKind.HullDamaged:
            return new FEPlaybackAnimationCommand(() => [
                new HitAnimation({ id: event.shipId, elements: getElementsFromIds([event.hullId]) }),
            ]);
        case TurnEventKind.ShipDestroyed: {
            const elements = getElementsFromIds(event.hullIds);
            return new FEPlaybackAnimationCommand(() => [new DestroyedAnimation({ id: event.shipId, elements })]);
        }
        case TurnEventKind.EffectDetonated:
            return new FEEffectDetonationAnimationCommand({ location: event.location });
        case TurnEventKind.ShipDeployed:
        case TurnEventKind.EffectCreated:
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
