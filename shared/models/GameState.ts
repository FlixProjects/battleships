import clone from "lodash.clonedeep";
import { Board, IGameState, IHull, IPlayer, IPlayerAction, IShip } from "../types";
import { mergeSets } from "../utils";
import { Action } from "./actions";
import { Entity } from "./entities";
import { Hull } from "./Hull";
import { Player } from "./Player";
import { Ship } from "./Ship";

export class GameState implements IGameState {
    code: string;
    currentRound: number;
    initiative?: string;
    players: Player[];
    ships: Ship[];
    hulls: Hull[];
    board: Board;
    winners: string[];
    isOver: boolean;
    actions?: Action[];

    // FIXME: there is issue when GameState is being passes in as a class already
    constructor(props: Readonly<IGameState>) {
        const { code, initiative, players, board, winners, isOver, ships, hulls, currentRound, actions } = props;
        this.code = code;
        this.initiative = initiative;
        this.board = board;
        this.winners = winners;
        this.isOver = isOver;
        this.currentRound = currentRound;

        this.hulls =
            hulls?.map((hull) => {
                if (hull instanceof Hull) {
                    return hull;
                }
                return new Hull(hull);
            }) ?? [];

        this.ships = ships.map((ship: IShip) => {
            if (ship instanceof Ship) {
                return ship;
            }

            ship.hulls = this.hulls?.filter((h) => h.shipId === ship.id);

            return new Ship(ship);
        });

        this.actions =
            actions?.map((action) => {
                if (action instanceof Action) {
                    return action;
                }
                return new Action(action);
            }) ?? [];

        this.players = players.map((player: IPlayer) => {
            if (player instanceof Player) {
                return player;
            }

            player.ships = this.ships?.filter((s) => s.playerId === player.id);
            // NOTE: there's a weird bug on browser that show pendingActions to be [] when there are actually elements
            player.pendingActions =
                this.actions?.filter((a) => a.playerId === player.id && a.round === this.currentRound) ?? [];

            return new Player(player);
        });
    }

    update(_gameState: Partial<IGameState>) {
        this.code = _gameState.code ?? this.code;
        this.initiative = _gameState.initiative ?? this.initiative;
        this.winners = _gameState.winners ?? this.winners;
        this.board = _gameState.board ?? this.board;
        this.isOver = _gameState.isOver ?? this.isOver;

        _gameState.players?.forEach((player: IPlayer) => this.updatePlayer(player));

        return this;
    }

    updateEntity<T extends Entity<T>>(entity: Partial<T>, collection: T[], EntityClass: new (props: any) => T): this {
        if (!entity.id) return this;
        const index = collection.findIndex((e) => e.id === entity.id);
        if (index === -1) return this;
        collection[index] = new EntityClass({ ...collection[index], ...entity });
        return this;
    }

    updatePlayer(player: Partial<IPlayer>) {
        return this.updateEntity(player, this.players, Player);
    }

    getPlayer(playerId: string): Player {
        const player = this.players.find((p) => p.id === playerId);
        if (!player) {
            throw new Error(`Player with id ${playerId} not found`);
        }
        return player;
    }

    getPlayers() {
        return this.players.map((player) => new Player(player));
    }

    getShip(shipId: string) {
        const ship = this.ships.find((s) => s.id === shipId);
        if (!ship) {
            throw new Error(`Ship with id ${shipId} not found`);
        }
        return ship;
    }

    updateShip(ship: Partial<IShip>) {
        return this.updateEntity(ship, this.ships, Ship);
    }

    addHull(hull: IHull) {
        if (!hull.id) return this;

        const hullIndex = this.hulls.findIndex((h) => h.id === hull.id);
        if (hullIndex !== -1) {
            return this.updateHull(hull);
        }

        this.hulls.push(new Hull(hull));
        return this;
    }

    getHull(hullId: string) {
        const hull = this.hulls.find((h) => h.id === hullId);
        if (!hull) {
            throw new Error(`Hull with id ${hullId} not found`);
        }
        return hull;
    }

    updateHull(hull: Partial<IHull>) {
        return this.updateEntity(hull, this.hulls, Hull);
    }

    addAction(action: IPlayerAction) {
        if (!action.id) return this;
        const actionIndex = this.actions.findIndex((a) => a.id === action.id);
        if (actionIndex !== -1) {
            return this.updateAction(action);
        }
        this.actions.push(action instanceof Action ? action : new Action(action));
        return this;
    }

    updateAction(action: Partial<IPlayerAction>) {
        return this.updateEntity(action, this.actions, Action);
    }

    removeInvisibleFromPlayer(visibleTiles: Set<string>, playerId: string) {
        // TODO: we should be able to achieve this without linking.
        this.linkShipHulls().linkPlayerShips();
        this.players = this.players.map((p) => (p.id !== playerId ? p.updateVisibility(visibleTiles) : p));

        this.linkPlayerShips({ reverse: true }).linkShipHulls({ reverse: true });
        return clone(this);
    }

    getVisibleTilesforPlayer(playerId: string) {
        this.linkShipHulls();
        const visibilityFromShips = mergeSets(
            this.ships.filter((s) => s.playerId === playerId).map((s) => s.getVisibleTiles()),
        );
        // TEMP: only Ships give visibility for now
        const visibleTilesForPlayer = mergeSets([visibilityFromShips]);

        return visibleTilesForPlayer;
    }

    linkPlayerShips(options: { reverse?: boolean } = {}) {
        if (options.reverse) {
            this.ships = this.players.flatMap((p) => p.ships);
            return this;
        }

        this.players.forEach((p) => {
            p.ships = this.ships.filter((s) => s.playerId === p.id);
        });
        return this;
    }

    linkShipHulls(options: { reverse?: boolean } = {}) {
        if (options.reverse) {
            this.hulls = this.ships.flatMap((s) => s.hulls);
            return this;
        }

        this.ships.forEach((s) => {
            s.hulls = this.hulls.filter((h) => h.shipId === s.id);
        });
        return this;
    }

    getFirstPlayerId() {
        return this.players.find((p) => p.order === 0)?.id;
    }

    isFirstPlayer(playerId: string) {
        return this.getFirstPlayerId() === playerId;
    }
}
