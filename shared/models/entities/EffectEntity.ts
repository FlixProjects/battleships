import { ICellLoc, IEffect, IGameState, TEffectKind, TEffectRefNo } from "../../types";
import { locationToKey } from "../../utils/helpers";
import { Listener } from "../listeners/Listener";
import { SignalType } from "../signals/types";
import { GameObjectWithVisibilityEntity } from "./GameObjectWithVisibilityEntity";

export class EffectEntity extends GameObjectWithVisibilityEntity<EffectEntity> implements IEffect {
    id: string;
    refNo: TEffectRefNo;
    kind: TEffectKind;
    sourceCardId?: string;
    playerId: string;
    duration: number;
    isActive: boolean;
    createdOnRound: number;
    expiresAfterRound?: number;
    existsOnBoard: boolean;
    imgSrc?: string;

    constructor(props: Readonly<IEffect>) {
        super();
        Object.assign(this, props);
    }

    // Seen by whoever sees its own tile or the entity it acts on.
    public projectVisibility(visibleTiles: Set<string>, affectedLocations: ICellLoc[] = []) {
        const ownLocations = this.existsOnBoard && this.location ? [this.location] : [];
        this.isVisible = [...ownLocations, ...affectedLocations].some((loc) => visibleTiles.has(locationToKey(loc)));
        return this;
    }

    public getAffectedLocations(_gameState: IGameState): ICellLoc[] {
        return [];
    }

    protected createProjectVisibilityListener() {
        return new Listener([SignalType.GameProjectVisibility], (ctx) => {
            this.projectVisibility(ctx.signal.payload.visibleTiles, this.getAffectedLocations(ctx.gsm.gameState));
        });
    }
}
