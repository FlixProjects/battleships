import { IHull, IHullTemplate, IShip } from "../../types";
import { Hull } from "../Hull";
import { Listener } from "../listeners/Listener";
import { IListener } from "../listeners/types";
import { BasicShipAttackSignalHandler } from "../signal-handlers/BasicShipAttackSignalHandler";
import { BasicShipMoveSignalHandler } from "../signal-handlers/BasicShipMoveSignalHandler";
import { ReceiveShipAttackSignalHandler } from "../signal-handlers/ReceiveShipAttackSignalHandler";
import { SignalType } from "../signals/types";
import { GameObjectEntity } from "./GameObjectEntity";

export class ShipEntity extends GameObjectEntity<ShipEntity> implements IShip {
    id: string;
    playerId: string;
    refNo: string;
    name: string;
    hulls: Hull[] = [];
    hullIds: string[] = [];
    dimensions: [number, number];
    deployed: boolean;
    commandPointCost: number;
    movementRange: number;
    remainingMovement: number;
    movementCommandPointCost: number;
    attackCountMax: number;
    attackRange: number;
    attackCommandPointCost: number;
    attackDamage: number;
    remainingAttacks: number;
    attackMinRange: number;
    destroyed: boolean;
    hullTemplates: IHullTemplate[];
    isFlagship: boolean;
    isVisible: boolean;

    constructor(props: Readonly<IShip>) {
        super();
        Object.assign(this, props);

        if (props.hulls && props.hulls.length > 0) {
            this.hulls = props.hulls.map((hull) => {
                if (hull instanceof Hull) {
                    return hull;
                }
                return new Hull(hull);
            });
        }
        this.hullIds = this.hulls.map((h) => h.id);
    }

    public getHulls() {
        return this.hulls ?? [];
    }

    public getHull(hullId: string) {
        return this.getHulls().find((h) => h.id === hullId);
    }

    public updateHull(hull: Partial<IHull>) {
        if (!hull.id) return this;
        const index = this.hulls.findIndex((h) => h.id === hull.id);

        if (index === -1) return this;
        const oldHull = this.hulls[index];
        const updatedHull = new Hull({ ...oldHull, ...hull });
        this.hulls[index] = updatedHull;
        return this;
    }

    public updateHulls(hulls: Partial<IHull>[]) {
        hulls.forEach((hull) => {
            this.updateHull(hull);
        });
        return this;
    }

    public addHullLocations(hulls: IHull[]) {
        if (!this.hulls) {
            this.hulls = [];
        }
        hulls.forEach((h) => this.addHullLocation(h));
        return this;
    }

    public addHullLocation(hull: IHull) {
        if (!(hull instanceof Hull)) {
            this.hulls.push(new Hull(hull));
            return this;
        }
        this.hulls.push(hull);
        return this;
    }

    public updateHullLocations(newHullLocations: Partial<IHull>[]) {
        newHullLocations.forEach((newHull) => {
            if (!newHull.id) return;
            const index = this.hulls.findIndex((h) => h.id === newHull.id);
            const oldHull = this.hulls[index];
            const updatedHull = new Hull({ ...oldHull, ...newHull });
            this.hulls[index] = updatedHull;
        });
        return this;
    }

    protected getDefaultListeners(): IListener[] {
        return [
            this.createBasicShipAttackListener(),
            this.createReceiveShipAttackListener(),
            this.createBasicShipMoveListener(),
        ];
    }

    protected createBasicShipAttackListener() {
        return new Listener(
            [SignalType.BasicShipAttack],
            (ctx) => {
                new BasicShipAttackSignalHandler().handle(ctx);
            },
            this.defaultHandlerShouldHandleSignal,
        );
    }

    protected createReceiveShipAttackListener() {
        return new Listener(
            [SignalType.ReceiveShipAttack],
            (ctx) => {
                new ReceiveShipAttackSignalHandler().handle(ctx);
            },
            this.defaultHandlerShouldHandleSignal,
        );
    }

    protected createBasicShipMoveListener() {
        return new Listener(
            [SignalType.BasicShipMove],
            (ctx) => {
                new BasicShipMoveSignalHandler().handle(ctx);
            },
            this.defaultHandlerShouldHandleSignal,
        );
    }
}
