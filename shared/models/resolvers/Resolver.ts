import { IGameState } from "@shared/types";
import { ResultType } from "@shared/types/result-types";
import { IValidator } from "@shared/utils/validator/types";
import { IResolver } from "./types";
import { mergician } from "mergician";

export class Resolver implements IResolver {
    private isValid = false;
    constructor(
        protected originalState: IGameState,
        protected calculate: () => IGameState,
        protected validator?: IValidator,
        protected onError: () => void = () => {
            // do nothing
        },
    ) {
        this.originalState = mergician({}, originalState) as IGameState;
    }

    private validate() {
        if (!this.validator) {
            this.isValid = true;
            return;
        }
        const validationResult = this.validator.validate();
        this.isValid = validationResult.type === ResultType.SUCCESS;

        if (!this.isValid) {
            this.onError();
        }
    }

    public resolve() {
        this.validate();
        if (this.isValid) {
            return this.calculate();
        }
        return this.originalState;
    }
}
