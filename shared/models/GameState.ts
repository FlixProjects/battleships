import { Board, IGameState, IPlayer } from "../types";
import { Player } from "./Player";

export class GameState implements IGameState {
    code: string;
    initiative?: string;
    players: Player[];
    board: Board;
    constructor(props: Readonly<IGameState>) {
        const { code, initiative, players, board } = props;
        this.code = code;
        this.initiative = initiative;
        this.board = board;

        this.players = players.map((player: IPlayer) => {
            if (player instanceof Player) {
                return player;
            }
            return new Player(player);
        });
    }

    updatePlayer(player: Partial<IPlayer>) {
        if (!player.id) return;

        const playerIndex = this.players.findIndex((p) => p.id === player.id);

        if (playerIndex !== -1) return;

        this.players[playerIndex] = new Player({ ...this.players[playerIndex], ...player });
    }

    getPlayer(playerId: string): Player {
        const player = this.players.find((p) => p.id === playerId);
        return new Player(player);
    }

    getPlayers() {
        return this.players.map((player) => new Player(player));
    }
}
