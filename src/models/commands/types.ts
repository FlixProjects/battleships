export const CommandType = {
    Client: "Client",
    Server: "Server",
};

export type TCommandType = keyof typeof CommandType;
