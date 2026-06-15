import { ICellLoc } from "../../types";
import { locationToKey } from "../../utils/helpers";
import { Listener } from "../listeners/Listener";
import { SignalType } from "../signals/types";
import { GameObjectEntity } from "./GameObjectEntity";
import { IListener } from "../listeners/types";

export class GameObjectWithVisibilityEntity<T extends GameObjectWithVisibilityEntity<T>> extends GameObjectEntity<T> {
    location: ICellLoc;
    isVisible: boolean;

    protected getDefaultListeners(): IListener[] {
        return [this.createProjectVisibilityListener()];
    }

    public projectVisibility(visibleTiles: Set<string>) {
        this.isVisible = visibleTiles.has(locationToKey(this.location));
        return this;
    }

    protected createProjectVisibilityListener() {
        return new Listener([SignalType.GameProjectVisibility], (ctx) => {
            this.projectVisibility(ctx.signal.payload.visibleTiles);
        });
    }
}
