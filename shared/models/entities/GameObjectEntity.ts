import { Action } from "../actions";
import { Entity } from "./Entity";

export class GameObjectEntity<T> extends Entity<T extends GameObjectEntity<T> ? T : GameObjectEntity<T>> {
    public id: string;

    resolveAction(action: Action) {
        // Implementation in child class
    }

    protected onMove() {}
    protected onAttack() {}
    protected onDeploy() {}


}
