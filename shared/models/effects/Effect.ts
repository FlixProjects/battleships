import { locationToKey } from "@shared/utils";
import { IEffect, IGameStateManager, IPlainEffect } from "../../types";
import { EffectEntity } from "../entities/EffectEntity";

/**
 * Concrete subclasses implement `resolve(gsm)` for the immediate, on-action effect
 */
export class Effect extends EffectEntity {
    constructor(props: Readonly<IEffect>) {
        super(props);
    }

    public resolve(_gsm: IGameStateManager): void {
        throw new Error(`Effect ${this.id} (refNo=${this.refNo}) does not implement resolve`);
    }

    public resolveTick(_gsm: IGameStateManager): void {
        // Default no-op. Persistent Effects (e.g. FlarePersistentEffect) override.
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
            createdOnRound: this.createdOnRound,
            expiresAfterRound: this.expiresAfterRound,
            payload: this.payload,
            existsOnBoard: this.existsOnBoard,
            location: this.location,
        };
    }
}
