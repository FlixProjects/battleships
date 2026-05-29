import { IGameObjectEntity, ISignalHandleCtx } from "@shared/types/types";
import { Listener } from "../listeners/Listener";
import { ListenerManager } from "../listeners/ListenerManager";
import { IListenerManager } from "../listeners/types";
import { BasicShipAttackSignalHandler } from "../signal-handlers/BasicShipAttackSignalHandler";
import { ReceiveShipAttackSignalHandler } from "../signal-handlers/ReceiveShipAttackSignalHandler";
import { SignalType } from "../signals/types";
import { Entity } from "./Entity";

export class GameObjectEntity<T>
    extends Entity<T extends GameObjectEntity<T> ? T : GameObjectEntity<T>>
    implements IGameObjectEntity
{
    public id: string;
    protected listenerManager: IListenerManager = new ListenerManager();

    public receiveSignal(ctx: ISignalHandleCtx) {
        this.listenerManager.listeners.forEach(({ listener, options }) => {
            listener.handleSignal(ctx);
            if (options.removeOnSignalHandled) {
                this.listenerManager.removeListener(listener.id);
            }
        });
    }

    public loadDefaultListeners() {
        const defaultListeners = [this.createBasicShipAttackListener(), this.createReceiveShipAttackListener()];
        defaultListeners.forEach((listener) => this.listenerManager.addListener(listener));
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

    private defaultHandlerShouldHandleSignal = (ctx: ISignalHandleCtx) => {
        return ctx.signal.targetId === this.id;
    };
}
