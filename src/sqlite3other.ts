import sqlite3 from "sqlite3";
import logger from "./logger";

let referDB: sqlite3.Database | null = null;

// 初始化数据库连接
export const initializeReferDB = (): Promise<void> => {
    return new Promise((resolve, reject) => {
        const path = global.config.referMintDBPath;
        logger.info("Database path:", path);

        if (!path) {
            const error = new Error("数据库路径未定义");
            logger.error(error.message);
            reject(error);
            return;
        }

        try {
            referDB = new sqlite3.Database(path, (err: Error | null) => {
                if (err) {
                    logger.error("连接数据库失败:", err.message);
                    reject(err);
                } else {
                    logger.info("成功连接到 SQLite 数据库");
                    resolve();
                }
            });
        } catch (error) {
            logger.error("创建数据库连接时发生错误:", error);
            reject(error);
        }
    });
};

const getDB = (): sqlite3.Database => {
    if (!referDB) {
        throw new Error("Database not initialized. Call initializeDB() first.");
    }
    return referDB;
};

// 更新状态函数
const updateStatus = (quote: string, isPaid: number, state: string, nowTime: number): void => {
    const sql = `UPDATE mint_quotes SET state = ?, paid_time = ?, paid=? WHERE quote = ?`;
    getDB().run(sql, [state, nowTime, isPaid, quote], function (this: sqlite3.RunResult, err: Error | null) { // 为 err 指定类型
        if (err) {
            console.error('更新数据失败：', err.message);
        } else {
            logger.info(`更新数据成功，影响的行数:`, this.changes);
        }
    });
};

// 导出所有操作
export {
    updateStatus,
};