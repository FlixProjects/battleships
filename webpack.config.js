const path = require("path");
const Dotenv = require("dotenv-webpack");
module.exports = {
    entry: "./src/index.ts",
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: "ts-loader",
                exclude: /node_modules/,
            },
        ],
    },
    devServer: {
        proxy: [
            {
                context: ["/api"],
                target: "http://localhost:3000",
            },
        ],
    },
    resolve: {
        extensions: [".tsx", ".ts", ".js"],
    },
    output: {
        filename: "bundle.js",
        path: path.resolve(__dirname, "public"),
    },
    plugins: [
        new Dotenv({
            systemvars: true,
        }),
    ],
};
