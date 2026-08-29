import { ApiResponse } from "./response";
import { type IApiResponseProps } from "./types";
import { ErrorCode, TErrorCode } from "../../../shared/types/response-types";

export class ErrorApiResponse extends ApiResponse {
    constructor(statusCode: TErrorCode = ErrorCode.INTERNAL_SERVER_ERROR, props: IApiResponseProps = {}) {
        super({ ...props, statusCode });
    }

    /** Prefer an `ERROR_MESSAGES` code — callers treat this as machine-readable. */
    public setMessage(message: string) {
        return this.setBody({ message });
    }
}
