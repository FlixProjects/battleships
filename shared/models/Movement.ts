
const DEFAULT_MOVEMENT_COST = 1;

export class Movement {
    public originalMovementCost = DEFAULT_MOVEMENT_COST;

    public unitsOfMovementLeft: number = 0;
    public unitsOfMovementUsed: number = 0;
    public movementCost = this.originalMovementCost;

    constructor(props?: Partial<Movement>) {
        Object.assign(this, props);
    }

    get cost() {
        return this.movementCost;
    }

    public resolve(resolveEffects?: (movement: Movement) => void) {
        resolveEffects?.(this);
        this.unitsOfMovementLeft -= this.cost;
        this.unitsOfMovementUsed += this.cost;
        this.restoreOriginalMovementCost();
    }

    get stillPossible() {
        return this.unitsOfMovementLeft >= this.cost;
    }

    private restoreOriginalMovementCost() {
        this.movementCost = this.originalMovementCost;
    }
}