import { ICellLoc, IHull } from "../../types";
import { locationToKey } from "../../utils/helpers";
import { Listener } from "../listeners/Listener";
import { IListener } from "../listeners/types";
import { HullMoveSignalHandler } from "../signal-handlers/HullMoveSignalHandler";
import { HullReceiveAttackSignalHandler } from "../signal-handlers/HullReceiveAttackSignalHandler";
import { HullReceiveDamageSignalHandler } from "../signal-handlers/HullReceiveDamageSignalHandler";
import { SignalType } from "../signals/types";
import { GameObjectEntity } from "./GameObjectEntity";

export class HullEntity extends GameObjectEntity<HullEntity> implements IHull {
    id: string;
    shipId: string; // ties the hull to the ship
    location: ICellLoc;
    destroyed: boolean;
    remainingHealth: number;
    remainingArmor: number;
    // template
    templateLocation: ICellLoc;
    maxHealth: number;
    armor: number;
    visionRange: number;
    imgSrc?: string | undefined; // TODO: amend to non-optional once ships config is updated
    front?: boolean | undefined;
    orientation: number;
    // extra
    isVisible: boolean;

    constructor(props: Readonly<IHull>) {
        super();
        Object.assign(this, props);
    }
    public projectVisibility(visibleTiles: Set<string>) {
        this.isVisible = visibleTiles.has(locationToKey(this.location));
        return this;
    }
    
    protected getDefaultListeners(): IListener[] {
        return [
            this.createHullReceiveAttackListener(),
            this.createHullReceiveDamageListener(),
            this.createHullMoveListener(),
            this.createProjectVisibilityListener(),
        ];
    }

    protected createProjectVisibilityListener() {
        return new Listener([SignalType.GameProjectVisibility], (ctx) => {
            this.projectVisibility(ctx.signal.payload.visibleTiles);
        });
    }

    protected createHullReceiveAttackListener() {
        return new Listener(
            [SignalType.HullReceiveAttack],
            (ctx) => {
                new HullReceiveAttackSignalHandler().handle(ctx);
            },
            this.defaultHandlerShouldHandleSignal,
        );
    }

    protected createHullReceiveDamageListener() {
        return new Listener(
            [SignalType.HullReceiveDamage],
            (ctx) => {
                new HullReceiveDamageSignalHandler().handle(ctx);
            },
            this.defaultHandlerShouldHandleSignal,
        );
    }

    protected createHullMoveListener() {
        return new Listener(
            [SignalType.HullMove],
            (ctx) => {
                new HullMoveSignalHandler().handle(ctx);
            },
            this.defaultHandlerShouldHandleSignal,
        );
    }
}
