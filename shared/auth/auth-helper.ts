import { JwtHelper } from "./jwt-helper";

const TOKEN_TTL_SECONDS = 60 * 15;

export const generateAuthToken = async (userId: string, secret: string): Promise<string> => {
    const jwtHelper = new JwtHelper();
    const currentTime = Math.floor(Date.now() / 1000);

    const payload = {
        sub: userId,
        iat: currentTime,
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
