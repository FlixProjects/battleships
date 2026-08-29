import { ERROR_MESSAGES } from "../../../shared/constants";
import { ErrorCode } from "../../../shared/types/response-types";
import { ErrorApiResponse } from "./error-response";
import { type IApiResponseProps } from "./types";

export class InternalServerErrorApiResponse extends ErrorApiResponse {
    constructor(props: IApiResponseProps = {}) {
        super(ErrorCode.INTERNAL_SERVER_ERROR, {
            ...props,
            // a caller-supplied body still wins, this is only the default
            body: { message: ERROR_MESSAGES.INTERNAL_SERVER_ERROR, ...props.body },
        });
    }
}
