import fs from "fs";

// 初始化全局
global.config = JSON.parse(fs.readFileSync('./config.json', 'utf8')) as Config;

import express from "express";
import logger from "./logger";
import * as sqlite3 from "./sqlite3";
import addressRoutes from "./routes/addressRoutes";
import { Config } from "./types";
import { initializeReferDB } from "./sqlite3other";
import { mintWithTaproot } from "./transfer/trans3";
import * as task from "./task";

// 创建 Express 应用
const app = express();
app.use(express.json());

async function initializeApp() {
  try {
      // 1. 确保配置加载
      if (!global.config) {
          throw new Error("全局配置未正确加载");
      }

      // 2. 初始化数据库（按顺序等待每个初始化完成）
      logger.info("开始初始化主数据库...");
      await sqlite3.initializeDB();
      logger.info("主数据库初始化完成");

      logger.info("开始初始化引用数据库...");
      await initializeReferDB();
      logger.info("引用数据库初始化完成");

      // 3. 挂载路由
      app.use("/", addressRoutes);

      // 4. 启动服务器（使用 Promise 包装）
      await new Promise<void>((resolve) => {
          app.listen(global.config.port, () => {
              logger.info(`服务器启动成功: http://localhost:${global.config.port}`);
              resolve();
          });
      });

      // 5. 其他初始化任务（如果需要）
      task.startTask();

      logger.info("应用程序初始化完成");
  } catch (error) {
      logger.error("应用程序初始化失败:", error);
      process.exit(1);
  }
}

// 启动应用
initializeApp().catch((error) => {
  logger.error("启动过程中发生未捕获的错误:", error);
  process.exit(1);
});