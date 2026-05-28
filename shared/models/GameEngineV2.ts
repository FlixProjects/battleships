import { ActionSignalCreator } from "@shared/models/signal-creators/ActionSignalCreator";
import { BasicShipAttackActionSignalCreator } from "@shared/models/signal-creators/BasicShipAttackActionSignalCreator";
import { Action, IGameObjectEntity, IGameState, IGameStateManager, ISignalHandleCtx } from "..";
import { BasicShipAttackSignalHandler } from "./signal-handlers/BasicShipAttackSignalHandler";
import { SignalHandler } from "./signal-handlers/SignalHandler";
import { Signal } from "./signals/Signal";
import { ISignal, SignalType } from "./signals/types";

export class GameEngine {
    private gameObjects: Map<string, IGameObjectEntity> = new Map();
    private signalStacks: Map<string, Signal[]> = new Map();
    private signalCreators: ActionSignalCreator[] = [new BasicShipAttackActionSignalCreator()];
    private signalHandlers: Map<SignalType, SignalHandler> = new Map([
        [SignalType.BasicShipAttack, new BasicShipAttackSignalHandler()],
    ]);

    constructor(
        private gameState: IGameState,
        private GSM: new (_gameState: IGameState) => IGameStateManager,
    ) {}

    // process an action
    // an Action represents a decision made by a player
    public run(action: Action) {
        this.loadInitialSignals(action);
        this.sendSignals();
    }

    private clearProcessedSignal(originId: string, signalId: string) {
        const signals = this.signalStacks.get(originId);
        if (!signals) return;

        this.signalStacks.set(
            originId,
            signals.filter((s) => s.id !== signalId),
        );

        if (this.signalStacks.get(originId)?.length === 0) {
            this.signalStacks.delete(originId);
        }
    }

    private sendSignals() {
        do {
            const signalStack = Array.from(this.signalStacks.entries())[0];
            if (!signalStack) break;

            const [originId, signals] = signalStack;
            const signal = signals[0];

            this.sendSignalToGameObjects(signal);
            this.clearProcessedSignal(originId, signal.id);
        } while (this.signalStacks.size > 0);
    }

    private sendSignalToGameObjects(signal: Signal) {
        this.gameObjects.forEach((obj) => {
            obj.receiveSignal(this.getSignalContext(signal));
        });
    }

    private emit(signal: Signal, originId?: string) {
        if (originId) {
            this.signalStacks.get(originId)?.push(signal);
        } else {
            this.signalStacks.set(signal.id, [signal]);
        }
    }

    private emitter(signals: Signal[]) {
        if (signals.length === 0) return;
        signals.forEach((s) => this.emit(s));
    }

    private loadInitialSignals(action: Action) {
        // map AttackSignal, MoveSignal, DeploySignal, etc. to a Signal with appropriate payload

        this.signalCreators.forEach((handler) => {
            const signals = handler.createIfValid(action);
            this.emitter(signals);
        });
    }

    private getSignalContext(signal: ISignal): ISignalHandleCtx {
        return {
            signal,
            gsm: new this.GSM(this.gameState),
            saveNewState: (newState: IGameState) => {
                this.gameState = newState;
            },
            emitter: (signals: ISignal[], originId: string) => {
                signals.forEach((s) => this.emit(s, originId));
            },
        };
    }
}
