import { ActionSignalCreator } from "@shared/models/signal-creators/ActionSignalCreator";
import { BasicShipAttackActionSignalCreator } from "@shared/models/signal-creators/BasicShipAttackActionSignalCreator";
import {
    Action,
    IGameManager,
    IGameObjectEntity,
    IGameState,
    IGameStateManager,
    ISignalHandleCtx
} from "..";
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
        private db: IGameManager,
        private GSM: new (_gameState: IGameState) => IGameStateManager,
    ) {}

    // process an action
    // an Action represents a decision made by a player
    public run(action: Action) {
        this.loadInitialSignals(action);
        this.sendSignals();
    }

    private sendSignals() {
        this.signalStacks.forEach((signals) => {
            signals.forEach((signal) => {
                this.sendSignalToGameObjects(signal);
            });
        });
    }

    private sendSignalToGameObjects(signal: Signal) {
        this.gameObjects.forEach((obj) => {
            obj.receiveSignal(signal, this.getSignalContext());
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

    private getSignalContext(): ISignalHandleCtx {
        return {
            gsm: new this.GSM(this.db.state.gameState),
            emitter: (signals: ISignal[], originId: string) => {
                signals.forEach((s) => this.emit(s, originId));
            },
        };
    }
}
