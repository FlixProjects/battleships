import { THttpResponseCode } from "../../../shared/types/response-types";

/** The plain shape API Gateway / a Lambda function URL expects back. */
export interface PlainApiResponse {
    statusCode: number;
    headers: Record<string, string>;
    body: string;
    multiValueHeaders?: Record<string, Array<string>>;
}

export interface IApiResponseProps {
    statusCode?: THttpResponseCode;
    headers?: Record<string, string>;
    body?: object;
}
