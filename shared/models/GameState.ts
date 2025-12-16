import { Board, IGameState, IPlayer } from "../types";
import { Player } from "./Player";

export class GameState implements IGameState {
    code: string;
    initiative?: string;
    players: Player[];
    board: Board;
    winners: string[];
    isOver: boolean;
    constructor(props: Readonly<IGameState>) {
        const { code, initiative, players, board, winners, isOver } = props;
        this.code = code;
        this.initiative = initiative;
        this.board = board;
        this.winners = winners;
        this.isOver = isOver;

        this.players = players.map((player: IPlayer) => {
            if (player instanceof Player) {
                return player;
            }
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
        return new Player(player);
    }

    getPlayers() {
        return this.players.map((player) => new Player(player));
    }
}
