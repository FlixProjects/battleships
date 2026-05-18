import { Projectile } from "../../../src/components/projectiles/Projectile";
import { DestroyedAnimation } from "../../../src/models/animations";
import { HitAnimation } from "../../../src/models/animations/HitAnimation";
import { StillAnimation } from "../../../src/models/animations/StillAnimation";
import { getElementsFromIds } from "../../../src/utils/game-helper";
import { ANIMATION_LAYER_ID } from "../../constants";
import { ICellLoc } from "../../types/types";
import { keyToLocation, locationToKey } from "../../utils";
import { FEAnimationCommand } from "./FEAnimationCommand";
import { ICommandExecutionParams } from "./types";

export class FEShipAttackAnimationCommand extends FEAnimationCommand {
    constructor(
        private props: {
            attackOrigin: ICellLoc;
            attackTileId: string;
        },
    ) {
        super();
    }

    public async execute(params: ICommandExecutionParams): Promise<void> {
        const { attackOrigin, attackTileId } = this.props;
        const { gsm } = params;

        // Derive which hulls were hit from post-save state (the
        // ServerAttackCommand sibling already resolved + persisted) — the same
        // computation that used to live in FEShipAttackCommand, relocated here.
        const attackLocationKey = locationToKey(keyToLocation(attackTileId));
        const shipsHit: Record<string, string[]> = {};
        gsm.gameState.hulls.forEach((hull) => {
            if (locationToKey(hull.location) === attackLocationKey) {
                shipsHit[hull.shipId] = shipsHit[hull.shipId] || [];
                shipsHit[hull.shipId].push(hull.id);
            }
        });

        const destroyedShips = gsm.gameState.ships.filter((s) => s.destroyed);
        const destroyedShipHullIds = destroyedShips.flatMap((s) => s.getHulls()).map((h) => h.id);
        const projectile = new Projectile({
            origin: attackOrigin,
            target: keyToLocation(attackTileId),
            parent: document.querySelector(ANIMATION_LAYER_ID) || undefined,
        });

        this.animationManager.enqueueMany([
            { animation: new StillAnimation({ elements: getElementsFromIds(destroyedShipHullIds), duration: 500 }) },
            { animation: projectile.createAnimation() },
        ]);

        Object.entries(shipsHit).forEach(([hitShipId, hullIds]) => {
            // FIXME: we ignore hitLocations for now
            const hitShipIsDestroyed = destroyedShips.map((s) => s.id).includes(hitShipId);
            const destroyedShip = destroyedShips.find((s) => s.id === hitShipId);
            // Note: we just play a hit animation on all hulls of the ship if it's destroyed
            const hitHulls = hitShipIsDestroyed ? (destroyedShip?.getHulls().map((h) => h.id) ?? hullIds) : hullIds;

            this.animationManager.enqueue(new HitAnimation({ id: hitShipId, elements: getElementsFromIds(hitHulls) }));
        });

        destroyedShips.forEach((ship) => {
            const hullIds = ship.getHulls().map((h) => h.id);
            this.animationManager.enqueue(
                new DestroyedAnimation({ id: ship.id, elements: getElementsFromIds(hullIds) }),
            );
        });

        this.animationManager.play();
    }

    public async undo(params: ICommandExecutionParams): Promise<void> {
        // TODO: undo animation
    }
}
