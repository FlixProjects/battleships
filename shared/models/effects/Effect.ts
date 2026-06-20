import { locationToKey } from "@shared/utils";
import { EffectKind, ICellLoc, IEffect, IGameState, IPlainEffect, ISignalHandleCtx, IVisionEffectPayload } from "../../types";
import { EffectEntity } from "../entities/EffectEntity";

/**
 * Concrete subclasses implement `resolve(ctx)` for the immediate, on-play impact.
 * It runs inside the play cascade, so an Effect applies itself by **emitting
 * signals** via `ctx.emitter` (e.g. a damage Effect emits `HullReceiveAttack`),
 * never by mutating other entities directly. Passive Effects (vision) are no-ops.
 */
export class Effect extends EffectEntity {
    constructor(props: Readonly<IEffect>) {
        super(props);
    }

    /**
     * Activate a pre-created Effect when its source card is played: stamp the
     * target, the round it was created, and the derived expiry, and mark it
     * active so it starts contributing to resolution/vision.
     */
    public activate(targetCell: ICellLoc | undefined, currentRound: number): this {
        this.isActive = true;
        this.createdOnRound = currentRound;
        this.expiresAfterRound = this.duration > 0 ? currentRound + this.duration : undefined;
        if (targetCell) {
            this.location = targetCell;
        }
        if (this.kind === EffectKind.Vision && targetCell) {
            const vision = this.payload as IVisionEffectPayload;
            this.payload = { kind: EffectKind.Vision, range: vision.range, center: targetCell };
        }
        return this;
    }

    public resolve(_ctx: ISignalHandleCtx): void {
        throw new Error(`Effect ${this.id} (refNo=${this.refNo}) does not implement resolve`);
    }

    public resolveTick(_gameState: IGameState): void {
        // Default no-op. Persistent Effects override. Driven per-turn by the
        // GamePersistentEffectsTick signal → GameState.tickPersistentEffects.
    }

    public isPersistent(): boolean {
        return this.expiresAfterRound !== undefined;
    }

    public hasExpired(currentRound: number): boolean {
        return this.expiresAfterRound !== undefined && currentRound > this.expiresAfterRound;
    }

    public updateVisibility(visibleTiles: Set<string>) {
        if (!this.existsOnBoard || !this.location) {
            this.isVisible = false;
            return this;
        }

        if (visibleTiles.has(locationToKey(this.location))) {
            this.isVisible = true;
        }
        return this;
    }

    public toPlain(): IPlainEffect {
        return {
            id: this.id,
            refNo: this.refNo,
            kind: this.kind,
            sourceCardId: this.sourceCardId,
            playerId: this.playerId,
            duration: this.duration,
            isActive: this.isActive,
            createdOnRound: this.createdOnRound,
            expiresAfterRound: this.expiresAfterRound,
            payload: this.payload,
            existsOnBoard: this.existsOnBoard,
            location: this.location,
        };
    }
}
