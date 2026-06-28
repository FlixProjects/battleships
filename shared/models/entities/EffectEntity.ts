import { IEffect, TEffectKind, TEffectRefNo } from "../../types";
import { locationToKey } from "../../utils/helpers";
import { GameObjectWithVisibilityEntity } from "./GameObjectWithVisibilityEntity";

export class EffectEntity extends GameObjectWithVisibilityEntity<EffectEntity> implements IEffect {
    id: string;
    refNo: TEffectRefNo;
    kind: TEffectKind;
    sourceCardId: string;
    playerId: string;
    duration: number;
    isActive: boolean;
    createdOnRound: number;
    expiresAfterRound?: number;
    existsOnBoard: boolean;

    constructor(props: Readonly<IEffect>) {
        super();
        Object.assign(this, props);
    }

    public projectVisibility(visibleTiles: Set<string>) {
        if (!this.existsOnBoard || !this.location) {
            this.isVisible = false;
            return this;
        }
        if (visibleTiles.has(locationToKey(this.location))) {
            this.isVisible = true;
        }
        return this;
    }
}
