import { ICellLoc, IEffect, TEffectKind, TEffectPayload } from "../../types";
import { locationToKey } from "../../utils/helpers";
import { Listener } from "../listeners/Listener";
import { IListener } from "../listeners/types";
import { SignalType } from "../signals/types";
import { GameObjectEntity } from "./GameObjectEntity";

export class EffectEntity extends GameObjectEntity<EffectEntity> implements IEffect {
    id: string;
    refNo: string;
    kind: TEffectKind;
    sourceCardId: string;
    playerId: string;
    createdOnRound: number;
    expiresAfterRound?: number;
    payload: TEffectPayload;
    existsOnBoard: boolean;
    // extra
    isVisible = false;
    location?: ICellLoc;

    constructor(props: Readonly<IEffect>) {
        super();
        Object.assign(this, props);
    }

    protected getDefaultListeners(): IListener[] {
        return [this.createProjectVisibilityListener()];
    }

    protected createProjectVisibilityListener() {
        return new Listener([SignalType.GameProjectVisibility], (ctx) => {
            this.projectVisibility(ctx.signal.payload.visibleTiles);
        });
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
