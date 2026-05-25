import { IGameObjectEntity, ISignalHandleCtx } from "@shared/types/types";
import { Listener } from "../listeners/Listener";
import { ListenerManager } from "../listeners/ListenerManager";
import { IListenerManager } from "../listeners/types";
import { BasicShipAttackSignalHandler } from "../signal-handlers/BasicShipAttackSignalHandler";
import { ISignal, SignalType } from "../signals/types";
import { Entity } from "./Entity";

export class GameObjectEntity<T>
    extends Entity<T extends GameObjectEntity<T> ? T : GameObjectEntity<T>>
    implements IGameObjectEntity
{
    public id: string;
    protected listenerManager: IListenerManager = new ListenerManager();

    public receiveSignal(signal: ISignal, ctx: ISignalHandleCtx) {
        this.listenerManager.listeners.forEach(({ listener, options }) => {
            listener.handleSignal(signal, ctx);
            if (options.removeOnSignalHandled) {
                this.listenerManager.removeListener(listener.id);
            }
        });
    }

    public loadDefaultListeners() {
        const basicShipAttackListener = this.createBasicShipAttackListener();
        this.listenerManager.addListener(basicShipAttackListener);
    }

    // Ship.attack should override callback if its a special attack
    protected createBasicShipAttackListener() {
        return new Listener([SignalType.BasicShipAttack], (signal, ctx) => {
            new BasicShipAttackSignalHandler().handle(signal, ctx);
        });
    }
}
