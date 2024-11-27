import fs from "fs";

// 初始化全局
global.config = JSON.parse(fs.readFileSync('./config.json', 'utf8')) as Config;

import express from "express";
import logger from "./logger";
import * as sqlite3 from "./sqlite3";
import addressRoutes from "./routes/addressRoutes";
import { Config } from "./types";
import { initializeReferDB } from "./sqlite3other";
import { getDataFromDB } from "./task";

// 创建 Express 应用
const app = express();
app.use(express.json());

// 初始化数据库
sqlite3.initializeDB();

initializeReferDB();


// 挂载路由
app.use("/", addressRoutes);

app.listen(global.config.port, () => {
  logger.info("Server running on port http://localhost:" + global.config.port);
});
