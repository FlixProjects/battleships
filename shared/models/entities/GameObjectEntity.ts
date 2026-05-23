import { IGameObjectEntity, ISignalHandleCtx } from "@shared/types/types";
import { Listener } from "../listeners/Listener";
import { IListener, TListenerCallback } from "../listeners/types";
import { BasicShipAttackSignalHandler } from "../signal-handlers/BasicShipAttackSignalHandler";
import { ISignal, SignalType } from "../signals/types";
import { Entity } from "./Entity";

type TListenerId = string;
interface IListenerOptions {
    removeOnSignalHandled?: boolean;
}
export class GameObjectEntity<T>
    extends Entity<T extends GameObjectEntity<T> ? T : GameObjectEntity<T>>
    implements IGameObjectEntity
{
    public id: string;
    protected listeners: Map<TListenerId, { listener: IListener; options: IListenerOptions }> = new Map();
    protected signalToListenerMap: Map<SignalType, TListenerId[]> = new Map();

    public receiveSignal(signal: ISignal, ctx: ISignalHandleCtx) {
        this.listeners.forEach(({ listener, options }) => {
            listener.handleSignal(signal, ctx);
            if (options.removeOnSignalHandled) {
                this.removeListenerFromListenerMap(listener.id);
            }
        });
    }

    protected addListener(listener: IListener, options: IListenerOptions = { removeOnSignalHandled: false }) {
        this.addListnerToListenerMap(listener, options).addListenerToSignalMap(listener);
        return this;
    }

    protected removeListener(listenerId: TListenerId) {
        this.removeListenerFromListenerMap(listenerId).removeListenerFromSignalMap(listenerId);
        return this;
    }

    public loadDefaultListeners() {
        const basicShipAttackListener = this.createBasicShipAttackListener();
        this.addListener(basicShipAttackListener);
    }

    // Ship.attack should override callback if its a special attack
    protected createBasicShipAttackListener() {
        return new Listener([SignalType.BasicShipAttack], (signal, ctx) => {
            new BasicShipAttackSignalHandler().handle(signal, ctx);
        });
    }

    protected overrideSignalListener(signalType: SignalType, newCallback: TListenerCallback) {
        const listenerIds = this.signalToListenerMap.get(signalType);
        if (listenerIds) {
            listenerIds.forEach((id) => this.overrideListener(id, newCallback));
        } else {
            console.warn(`No listeners found for signal type ${signalType} to override.`);
        }
    }

    protected overrideListener(listenerId: string, newCallback: TListenerCallback) {
        const listenerEntry = this.listeners.get(listenerId);
        if (listenerEntry) {
            listenerEntry.listener.overrideCallback(newCallback);
        } else {
            console.warn(`Listener with id ${listenerId} not found for override.`);
        }
    }

    private addListnerToListenerMap(listener: IListener, options: IListenerOptions) {
        this.listeners.set(listener.id, { listener, options });
        return this;
    }

    private addListenerToSignalMap(listener: IListener) {
        listener.signalTypes.forEach((signalType) => {
            const existingListeners = this.signalToListenerMap.get(signalType) || [];
            this.signalToListenerMap.set(signalType, Array.from(new Set([...existingListeners, listener.id])));
        });
        return this;
    }

    private removeListenerFromListenerMap(listenerId: TListenerId) {
        this.listeners.delete(listenerId);
        return this;
    }

    private removeListenerFromSignalMap(listenerId: TListenerId) {
        this.signalToListenerMap.forEach((listenerIds, signalType) => {
            this.signalToListenerMap.set(
                signalType,
                listenerIds.filter((id) => id !== listenerId),
            );
        });
        return this;
    }
}
