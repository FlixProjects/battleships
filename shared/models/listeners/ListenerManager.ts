import { SignalType } from "../signals/types";
import { TListenerId, IListener, IListenerOptions, IListenerManager, TListenerCallback } from "./types";

export class ListenerManager implements IListenerManager {
    protected _listeners: Map<TListenerId, { listener: IListener; options: IListenerOptions }> = new Map();
    protected signalToListenerMap: Map<SignalType, TListenerId[]> = new Map();

    get listeners() {
        return this._listeners;
    }

    public addListener(listener: IListener, options: IListenerOptions = { removeOnSignalHandled: false }) {
        this.addListnerToListenerMap(listener, options).addListenerToSignalMap(listener);
        return this;
    }

    public removeListener(listenerId: TListenerId) {
        this.removeListenerFromListenerMap(listenerId).removeListenerFromSignalMap(listenerId);
        return this;
    }

    public overrideSignalListener(signalType: SignalType, newCallback: TListenerCallback) {
        const listenerIds = this.signalToListenerMap.get(signalType);
        if (listenerIds) {
            listenerIds.forEach((id) => this.overrideListener(id, newCallback));
        } else {
            console.warn(`No listeners found for signal type ${signalType} to override.`);
        }
        return this;
    }

    public overrideListener(listenerId: string, newCallback: TListenerCallback) {
        const listenerEntry = this._listeners.get(listenerId);
        if (listenerEntry) {
            listenerEntry.listener.overrideCallback(newCallback);
        } else {
            console.warn(`Listener with id ${listenerId} not found for override.`);
        }
        return this;
    }

    private addListnerToListenerMap(listener: IListener, options: IListenerOptions) {
        this._listeners.set(listener.id, { listener, options });
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
        this._listeners.delete(listenerId);
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
