import clone from "lodash.clonedeep";
import { Board, IGameState, IHull, IPlayer, IPlayerAction, IShip } from "../types";
import { mergeSets } from "../utils";
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
    actions?: IPlayerAction[];

    constructor(props: Readonly<IGameState>) {
        const { code, initiative, players, board, winners, isOver, ships, hulls, currentRound, actions } = props;
        this.code = code;
        this.initiative = initiative;
        this.board = board;
        this.winners = winners;
        this.isOver = isOver;
        this.currentRound = currentRound;
        this.actions = actions;

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

        this.players = players.map((player: IPlayer) => {
            if (player instanceof Player) {
                return player;
            }

            player.ships = this.ships?.filter((s) => s.playerId === player.id);
            // NOTE: there's a weird bug on browser that show pendingActions to be [] when there are actually elements
            player.pendingActions = this.actions?.filter(
                (a) => a.playerId === player.id && a.round === this.currentRound,
            );

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

    updatePlayer(player: Partial<IPlayer>) {
        if (!player.id) return this;
        const playerIndex = this.players.findIndex((p) => p.id === player.id);
        if (playerIndex === -1) return this;
        this.players[playerIndex] = new Player({ ...this.players[playerIndex], ...player });
        return this;
    }

    getPlayer(playerId: string): Player {
        const player = this.players.find((p) => p.id === playerId);
        return player;
    }

    getPlayers() {
        return this.players.map((player) => new Player(player));
    }

    getShip(shipId: string) {
        return this.ships.find((s) => s.id === shipId);
    }

    updateShip(ship: Partial<IShip>) {
        if (!ship.id) return this;

        const shipIndex = this.ships.findIndex((s) => s.id === ship.id);
        if (shipIndex === -1) return this;

        this.ships[shipIndex] = new Ship({ ...this.ships[shipIndex], ...ship });
        return this;
    }

    updateHull(hull: Partial<IHull>) {
        if (!hull.id) return this;

        const hullIndex = this.hulls.findIndex((h) => h.id === hull.id);
        if (hullIndex === -1) return this;

        this.hulls[hullIndex] = new Hull({ ...this.hulls[hullIndex], ...hull });
        return this;
    }

    addAction(action: IPlayerAction) {
        if (!action.id) return this;
        const actionIndex = this.actions.findIndex((a) => a.id === action.id);
        if (actionIndex !== -1) {
            return this.updateAction(action);
        }
        this.actions.push(action);
        return this;
    }

    updateAction(action: Partial<IPlayerAction>) {
        if (!action.id) return this;
        const actionIndex = this.actions.findIndex((a) => a.id === action.id);
        if (actionIndex === -1) {
            return this;
        }
        this.actions[actionIndex] = { ...this.actions[actionIndex], ...action };
        return this;
    }

    removeInvisibleFromPlayer(visibleTiles: Set<string>, playerId: string) {
        this.players = this.players.map((p) => (p.id !== playerId ? p.updateVisibility(visibleTiles) : p));
        return clone(this);
    }

    getVisibleTilesforPlayer(playerId: string) {
        const visibilityFromShips = mergeSets(this.getPlayer(playerId).ships.map((s) => s.getVisibleTiles()));
        // TEMP: only Ships give visibility for now
        const visibleTilesForPlayer = mergeSets([visibilityFromShips]);

        return visibleTilesForPlayer;
    }
}
