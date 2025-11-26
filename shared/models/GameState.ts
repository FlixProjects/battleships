import { Board, IGameState, IPlayer } from "../types";
import { Player } from "./Player";

export class GameState implements IGameState {
    code: string;
    initiative?: string;
    players: Player[];
    board: Board;
    constructor(props: Readonly<IGameState>) {
        const { code, initiative, players, board} = props
        this.code = code
        this.initiative = initiative
        this.board = board

        this.players = players.map((player: IPlayer) => {
            if (!(player instanceof Player)) {
                return new Player(player);
            }
        });
    }
}
