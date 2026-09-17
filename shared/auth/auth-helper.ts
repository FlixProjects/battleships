import { JwtHelper } from "./jwt-helper";

const TOKEN_TTL_SECONDS = 60 * 15;

interface IGenerateAuthTokenParams {
    userId: string;
    secret: string;
    thumbprint: string;
}

export const generateAuthToken = async (params: IGenerateAuthTokenParams): Promise<string> => {
    const { secret, userId, thumbprint } = params;
    const jwtHelper = new JwtHelper();
    const currentTime = Math.floor(Date.now() / 1000);

    const payload = {
        sub: userId,
        iat: currentTime,
        cnf: { jkt: thumbprint }, // DPoP confirmation; RFC 7800
        exp: currentTime + TOKEN_TTL_SECONDS,
    };

    return await jwtHelper.sign(payload, secret, "HS256");
};

export const verifyAuthToken = async (token: string, secret: string): Promise<string> => {
    const payload = await new JwtHelper().verify(token, secret, "HS256");

    if (typeof payload.sub !== "string" || payload.sub.length === 0) {
        throw new Error("auth token has no subject");
    }

    return payload.sub;
};
