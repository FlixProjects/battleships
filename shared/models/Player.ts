import { IGameState, IPlainPlayer, IPlayer, IPlayerAction, IShip } from "../types";
import { Card } from "./Card";
import { PlayerEntity } from "./entities/PlayerEntity";

export class Player extends PlayerEntity {
    constructor(props: IPlayer) {
        super(props);
    }

    public playCard(card: Card): this {
        if (!this.hand.includes(card.id)) return this;
        this.hand = this.hand.filter((id) => id !== card.id);
        card.onPlay();
        return this;
    }

    public getVisibilityFromShips() {
        const visibleTilesets = this.ships.map((ship) => ship.getVisibleTiles());

        const visibleTiles = new Set<string>();

        visibleTilesets.forEach((tileset) => {
            tileset.forEach((tile) => {
                visibleTiles.add(tile);
            });
        });

        return visibleTiles;
    }

    public updateVisibility(visibleTiles: Set<string>) {
        this.ships.forEach((ship) => {
            ship.updateVisibility(visibleTiles);
        });
        this.removeInvisibleShips();
        return this;
    }

    public removeInvisibleShips() {
        this.ships = this.ships.filter((ship) => ship.isVisible);
        return this;
    }

    /** Flattens ships and pendingActions to ID arrays. */
    public toPlain(): IPlainPlayer {
        return {
            ...this,
            ships: this.ships?.map((s) => s.id) ?? [],
            pendingActions: this.pendingActions?.map((a) => a.id) ?? [],
        };
    }

    public static toDomain(plain: IPlainPlayer, state: IGameState): Player {
        const shipsById = new Map<string, IShip>((state.ships ?? []).map((s) => [s.id, s]));
        const ships = plain.ships
            .map((id) => shipsById.get(id))
            .filter((s): s is IShip => s !== undefined);

        const actionsById = new Map<string, IPlayerAction>((state.actions ?? []).map((a) => [a.id, a]));
        const pendingActions = plain.pendingActions
            .map((id) => actionsById.get(id))
            .filter((a): a is IPlayerAction => a !== undefined);

        return new Player({ ...plain, ships, pendingActions } as IPlayer);
    }
}
