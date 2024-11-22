import sqlite3 from "sqlite3";
import logger from "./logger";

let referDB: sqlite3.Database | null = null;

// 初始化数据库连接
export const initializeReferDB = (): void => {
    const path = global.config.referMintDBPath;
    logger.info("Database path:", path);

    referDB = new sqlite3.Database(path, (err: Error | null) => {
        if (err) {
            logger.error("Failed to connect to database:", err.message);
        } else {
            logger.info("Successfully connected to SQLite database");
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