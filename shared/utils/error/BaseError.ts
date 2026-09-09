import { TErrorMessages } from "@shared/constants";
import { ResultType, TErrorTypes } from "@shared/types";

export class BaseError {
    public errorType: TErrorTypes;
    public errorCode?: TErrorMessages;
    public message?: string;
    public type: typeof ResultType.ERROR = ResultType.ERROR;

    constructor(props?: Readonly<Partial<BaseError>>) {
        Object.assign(this, props);
    }
}
