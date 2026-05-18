import { IDeployAction, IGameState, IMoveAction, IPlayCardAction, IPlayerAction, IShipAttackAction } from "../../../types";

/**
 * The narrow surface a resolve step is allowed to touch on the resolver.
 * Kept minimal so each step stays an individually testable unit rather than
 * depending on the whole `ActionResolver`. `ActionResolver` structurally
 * satisfies this.
 */
export interface IResolveStepContext {
    gameState: IGameState;
    resolvePlayCard(action: IPlayCardAction): IGameState;
    resolveDeploy(action: IDeployAction): IGameState;
    resolveMove(action: IMoveAction): IGameState;
    resolveAttack(action: IShipAttackAction): IGameState;
    // Drains + resolves support inner-actions queued by ResolvePlayCardStep
    resolvePendingSupportEffects(): void;
}

/**
 * One unit of per-action resolution. The pipeline runs every step in a fixed
 * order; a step is a no-op unless the action is relevant to it. Replaces the
 * old `resolveAction()` switch (Decision 2 / C1). A future entity-driven model
 * (GameObject.onAction) can be introduced as another step without touching the
 * sequencer.
 */
export interface IResolveStep {
    readonly name: string;
    resolve(action: IPlayerAction, ctx: IResolveStepContext): void;
}
