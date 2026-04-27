import { Projectile } from "../../../src/components/projectiles/Projectile";
import { animationManager } from "../../../src/models/AnimationManager";
import { DestroyedAnimation } from "../../../src/models/animations";
import { HitAnimation } from "../../../src/models/animations/HitAnimation";
import { StillAnimation } from "../../../src/models/animations/StillAnimation";
import { getElementsFromIds } from "../../../src/utils/game-helper";
import { ANIMATION_LAYER_ID } from "../../constants";
import { ICellLoc } from "../../types/types";
import { keyToLocation } from "../../utils";
import { FEAnimationCommand } from "./FEAnimationCommand";
import { ICommandExecutionParams } from "./types";

export class FEShipAttackAnimationCommand extends FEAnimationCommand {
    constructor(
        private props: {
            attackOrigin: ICellLoc;
            attackTileId: string;
            shipsHit: Record<string, string[]>;
        },
    ) {
        super();
    }

    public async execute(params: ICommandExecutionParams): Promise<void> {
        const { attackOrigin, attackTileId, shipsHit } = this.props;
        const { gsm } = params;

        const destroyedShips = gsm.gameState.ships.filter((s) => s.destroyed);
        const destroyedShipHullIds = destroyedShips.flatMap((s) => s.hulls).map((h) => h.id);
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
            animationManager.enqueue(new HitAnimation({ id: hitShipId, elements: getElementsFromIds(hullIds) }));
        });

        destroyedShips.forEach((ship) => {
            const hullIds = ship.hulls.map((h) => h.id);
            animationManager.enqueue(new DestroyedAnimation({ id: ship.id, elements: getElementsFromIds(hullIds) }));
        });

        this.animationManager.play();
    }

    public async undo(params: ICommandExecutionParams): Promise<void> {
        // TODO: undo animation
    }
}
