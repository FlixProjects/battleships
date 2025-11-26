import { gameManager } from "../..";
import { BOARD_COLUMNS, BOARD_ROWS, ICellLoc, IShip, IPlayer, locationToKey } from "../../../shared";
import { IAppState } from "../../types";
import { renderShipIcon } from "../../utils/game-helper";
import { BaseComponent } from "../BaseComponent";
import { Tile } from "./Tile";

export class GameBoard extends BaseComponent {
    private container = document.getElementById("gameArea") as HTMLDivElement;
    private tiles: Record<string, Tile> = {};

    constructor() {
        super();
        this.build();
    }

    updateState(_state?: IAppState): void {
        this.remove();
        if (_state?.gameState?.players?.length === 2) {
            this.build();
            return;
        }
    }

    build() {
        this.ref = document.createElement("div");

        this.addStyles();

        for (let row = 0; row < BOARD_ROWS; row++) {
            for (let col = 0; col < BOARD_COLUMNS; col++) {
                this.renderTile(`${col},${row}`);
            }
        }

        this.renderPlayersShips();
        this.container.appendChild(this.ref);

        return this.ref;
    }

    protected addStyles(): void {
        this.ref.innerHTML = "";
        this.ref.style.display = "grid";
        this.ref.style.gridTemplateColumns = "repeat(7, 48px)";
        this.ref.style.gap = "2px";
        this.ref.style.padding = "12px";
    }

    public updateSelectableTiles(validCells: [number, number][]) {
        const validCellIndices = validCells.map((cell: ICellLoc) => locationToKey(cell));
        Object.keys(this.tiles).forEach((tileIndex: string) => {
            if (validCellIndices.includes(tileIndex)) {
                this.tiles[tileIndex].setSelectable(true);
            } else {
                this.tiles[tileIndex].setSelectable(false);
            }
        });
    }

    private renderTile(key: string) {
        const tile = new Tile({ id: key });
        this.tiles[key] = tile;
        this.ref.appendChild(tile.build());
    }

    private renderPlayersShips() {
        const gameState = gameManager.state.gameState;
        if (!gameState) return;
        gameState.players?.forEach((p) => {
            this.renderPlayerShips(p);
        });
    }

    private renderPlayerShips(player: IPlayer) {
        player.ships
            .filter((s) => s.deployed && !s.destroyed) // TEMP: we should differentiate expected destruction vs actual
            .forEach((ship) => {
                this.renderShip(ship, gameManager.firstPlayerId === player.id);
            });
    }

    private renderShip(ship: IShip, isFirstPlayer = true) {
        const tiles = ship.hullLocations?.map((hull) => {
            return { key: locationToKey(hull.location) };
        });

        tiles.forEach(({ key }) => {
            const tile = this.tiles[key];
            renderShipIcon(tile, ship.id, ship.refNo, isFirstPlayer);

            if (gameManager.getPlayer().id === ship.playerId) {
                tile.addShipClickHandler();
            }
        });
    }
}
