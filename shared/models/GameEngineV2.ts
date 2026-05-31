import { ActionSignalCreator } from "@shared/models/signal-creators/ActionSignalCreator";
import { BasicShipAttackActionSignalCreator } from "@shared/models/signal-creators/BasicShipAttackActionSignalCreator";
import { IPlayerAction, IGameObjectEntity, IGameState, IGameStateManager, ISignalHandleCtx, GameState } from "..";
import { BasicShipAttackSignalHandler } from "./signal-handlers/BasicShipAttackSignalHandler";
import { SignalHandler } from "./signal-handlers/SignalHandler";
import { Signal } from "./signals/Signal";
import { ISignal, SignalType } from "./signals/types";
import { GameObjectEntity } from "./entities/GameObjectEntity";

export class GameEngine {
    private currentAction: IPlayerAction | null = null;
    private gameObjects: Map<string, IGameObjectEntity> = new Map();
    private signalStacks: Map<string, Signal[]> = new Map();
    private signalCreators: ActionSignalCreator[] = [new BasicShipAttackActionSignalCreator()];
    private signalHandlers: Map<SignalType, SignalHandler> = new Map([
        [SignalType.BasicShipAttack, new BasicShipAttackSignalHandler()],
    ]);

    constructor(
        private gameState: IGameState,
        private GSM: new (_gameState: IGameState) => IGameStateManager,
    ) {
        this.loadGameObjects();
    }

    // process an action
    // an Action represents a decision made by a player
    public run(action: IPlayerAction) {
        this.resetRun();
        this.currentAction = action;
        if (this.isValidAction()) {
            this.recordAction();
            this.loadInitialSignals(action);
            this.sendSignals();
        }
        return this.gameState;
    }

    private resetRun() {
        this.currentAction = null;
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
            const signalStack = this.signalStacks.entries().next().value;
            if (!signalStack) break;
            const [originId, signals] = signalStack;
            const signal = signals[0];

            this.sendSignalToGameObjects(signal);
            this.clearProcessedSignal(originId, signal.id);
        } while (true);
    }

    private sendSignalToGameObjects(signal: Signal) {
        this.gameObjects.forEach((obj) => {
            obj.receiveSignal(this.getSignalContext(signal));
        });
    }

    private emit(signal: Signal) {
        if (this.signalStacks.has(signal.originId)) {
            this.signalStacks.get(signal.originId)?.push(signal);
        } else {
            this.signalStacks.set(signal.originId, [signal]);
        }
    }

    private emitter(signals: Signal[]) {
        if (signals.length === 0) return;
        signals.forEach((s) => this.emit(s));
    }

    private loadInitialSignals(action: IPlayerAction) {
        // map AttackSignal, MoveSignal, DeploySignal, etc. to a Signal with appropriate payload

        this.signalCreators.forEach((handler) => {
            const signals = handler.createIfValid(action);
            this.emitter(signals);
        });
    }

    private recordAction() {
        if (!this.currentAction) return;
        const action = this.currentAction;
        const gsm = new this.GSM(this.gameState);
        gsm.addPendingAction(action).addAction(action);
        this.gameState = gsm.gameState;
    }

    private isValidAction() {
        if (!this.currentAction) return false;
        return true; // FIXME: Implement action validators based on type
    }

    private getSignalContext(signal: ISignal): ISignalHandleCtx {
        return {
            signal,
            gsm: new this.GSM(this.gameState),
            saveNewState: (newState: IGameState) => {
                this.gameState = newState;
            },
            emitter: (signals: ISignal[]) => {
                signals.forEach((s) => this.emit(s));
            },
        };
    }

    private loadGameObjects() {
        const visited = new WeakSet<object>(); // for recognizing objects + prevent cyclical paths
        for (let key in this.gameState) {
            const value = this.gameState[key as TGameStatePropKey];
            this.registerGameObjects(value, visited);
        }
    }

    private registerGameObjects = (value: any, visited: WeakSet<object>): any => {
        if (this.isPrimitive(value) || this.isNullOrUndefined(value)) {
            return;
        }
        if (visited.has(value)) return;
        visited.add(value);

        if (Array.isArray(value)) {
            value.forEach((val) => this.registerGameObjects(val, visited));
            return;
        }
        if (value instanceof GameObjectEntity) {
            if (this.gameObjects.has(value.id)) return;
            return value.registerGameObject(this.register);
        }
        if (typeof value === "object") {
            for (let key in value) {
                this.registerGameObjects(value[key], visited);
            }
            return;
        }
    };

    private register = (id: string, go: GameObjectEntity<any>) => {
        this.gameObjects.set(id, go);
    };

    private isPrimitive(value: any) {
        return (
            typeof value === "string" ||
            typeof value === "boolean" ||
            typeof value === "number" ||
            typeof value === "function"
        );
    }

    private isNullOrUndefined(value: any) {
        return value === null || value === undefined;
    }
}
type TGameStatePropKey = keyof IGameState;
