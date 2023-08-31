import type IForkTsCheckerWebpackPlugin from "fork-ts-checker-webpack-plugin";

const ForkTsCheckerWebpackPlugin: typeof IForkTsCheckerWebpackPlugin = require("fork-ts-checker-webpack-plugin");
const Dotenv = require("dotenv-webpack");

export const plugins = [
  new Dotenv(),
  new ForkTsCheckerWebpackPlugin({
    logger: "webpack-infrastructure",
  }),
];
