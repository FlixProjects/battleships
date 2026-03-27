import { interactionManager } from "../..";
import { IPlayer } from "@shared/types";
import { IMEventType } from "../../models/interaction-manager/types";
import { BaseComponent } from "../BaseComponent";
import { getComponents } from "../component-helper";
import { Toast } from "../Toast";
import { ShipRow } from "./ShipRow";

interface Props {
    isGameOver: boolean;
    player: IPlayer;
}

export class ShipSelector extends BaseComponent {
    private selectedShip?: string;
    private shipRows: ShipRow[] = [];

    constructor(private props: Props) {
        super();
    }

    public build() {
        this.ref = document.createElement("div");
        this.addStyles();
        this.renderShipRows();
        return this.ref;
    }

    private renderShipRows() {
        const { player, isGameOver } = this.props;
        const flagshipNotDeployed = this.getFlagshipNotDeployed();
        const flagshipId = flagshipNotDeployed?.id;
        const hasFlagshipNotDeployed = !!flagshipId;

        player?.ships?.forEach(({ id, refNo, deployed, commandPointCost }) => {
            const shipIsFlagship = flagshipId === id;
            if (!deployed) {
                const selected = hasFlagshipNotDeployed ? shipIsFlagship : this.selectedShip === id;
                const onSelect =
                    hasFlagshipNotDeployed && !shipIsFlagship
                        ? () => {
                              Toast.show({ message: "Deploy flagship first!", type: "warning", duration: 3000 });
                          }
                        : (shipId: string) => this.setSelected(shipId);

                const shipRow = new ShipRow({
                    shipId: id,
                    selected,
                    onSelect,
                    isSelectable: !isGameOver && player.commandPoints >= commandPointCost && !player.ready,
                    refNo,
                });
                this.shipRows.push(shipRow);
                this.addChild(shipRow);
                this.ref.appendChild(shipRow.build());
            }
        });

        if (this.hasFlagshipNotDeployed) {
            this.selectFlagship();
        }
    }

    private selectFlagship() {
        const flagship = this.props.player.ships.find((s) => s.isFlagship);
        if (!flagship) return;
        this.setSelected(flagship.id);
    }

    private getFlagshipNotDeployed() {
        return this.props.player.ships.find((s) => s.isFlagship && !s.deployed);
    }

    private get hasFlagshipNotDeployed() {
        const player = this.props.player;
        const flagshipIndex = player.ships.findIndex((s) => s.isFlagship);
        return flagshipIndex > -1 && !player.ships[flagshipIndex].deployed;
    }

    private setSelected(id: string) {
        this.selectedShip = id;
        this.shipRows.forEach((row) => {
            const isSelected = row.props.shipId === id;
            row.setSelected(isSelected);
        });

        interactionManager.handleEvent({
            type: IMEventType.DEPLOYING_SHIP,
            shipId: this.selectedShip,
            onGlobalDeselect: this.hasFlagshipNotDeployed
                ? () => {
                      this.selectFlagship();
                      this.clearSelection();
                  }
                : () => this.clearSelection(),
        });
    }

    private clearSelection() {
        this.selectedShip = undefined;
        this.shipRows.forEach((row) => row.setSelected(false));
        getComponents().div.gameBoard.updateSelectableTiles([]);
    }

    protected addStyles(): void {
        this.ref.style.display = "flex";
        this.ref.style.flexDirection = "column";
    }
}
