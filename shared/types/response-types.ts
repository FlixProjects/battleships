export const ErrorCode = {
    BAD_REQUEST: 400,
    UNAUTHORISED: 401,
    AUTHORIZATION_FAILED: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    INTERNAL_SERVER_ERROR: 500,
} as const;

export const SuccessCode = {
    SUCCESS: 200,
    CREATED: 201,
} as const;

export const RedirectCode = {
    REDIRECT: 302,
} as const;

export type TErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode];
export type TSuccessCode = (typeof SuccessCode)[keyof typeof SuccessCode];
export type TRedirectCode = (typeof RedirectCode)[keyof typeof RedirectCode];

export type THttpResponseCode = TErrorCode | TSuccessCode | TRedirectCode;
