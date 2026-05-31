import { IGameObjectEntity, ISignalHandleCtx } from "@shared/types/types";
import { Listener } from "../listeners/Listener";
import { ListenerManager } from "../listeners/ListenerManager";
import { IListener, IListenerManager, IListenerOptions } from "../listeners/types";
import { BasicShipAttackSignalHandler } from "../signal-handlers/BasicShipAttackSignalHandler";
import { ReceiveShipAttackSignalHandler } from "../signal-handlers/ReceiveShipAttackSignalHandler";
import { SignalType } from "../signals/types";
import { Entity } from "./Entity";

export class GameObjectEntity<T extends GameObjectEntity<T>> extends Entity<T> implements IGameObjectEntity {
    public id: string;
    //ECMAScript private field. private at runtime: not enumerable
    #listenerManager: IListenerManager = new ListenerManager();

    constructor() {
        super();
        this.loadDefaultListeners();
    }

    public receiveSignal(ctx: ISignalHandleCtx) {
        this.#listenerManager.listeners.forEach(({ listener, options }) => {
            listener.handleSignal(ctx);
            if (options.removeOnSignalHandled) {
                this.#listenerManager.removeListener(listener.id);
            }
        });
    }

    public loadDefaultListeners() {
        this.getDefaultListeners().forEach((listener) => this.addListener(listener));
    }

    protected getDefaultListeners(): IListener[] {
        return [this.createBasicShipAttackListener(), this.createReceiveShipAttackListener()];
    }

    protected addListener(listener: IListener, options?: IListenerOptions) {
        this.#listenerManager.addListener(listener, options);
        return this;
    }

    // Ship.attack should override callback if its a special attack
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

    protected defaultHandlerShouldHandleSignal = (ctx: ISignalHandleCtx) => {
        return ctx.signal.targetId === this.id;
    };

    public registerGameObject(register: (id: string, go: GameObjectEntity<T>) => void) {
        register(this.id, this);
    }
}
