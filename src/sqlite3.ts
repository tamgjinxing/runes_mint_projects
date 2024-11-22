import sqlite3 from "sqlite3";
import logger from "./logger";

let db: sqlite3.Database | null = null;

// 初始化数据库连接
export const initializeDB = (): void => {
  const path = global.config.runeMintDBPath;
  logger.info("Database path:", path);

  db = new sqlite3.Database(path, (err: Error | null) => {
    if (err) {
      logger.error("Failed to connect to database:", err.message);
    } else {
      logger.info("Successfully connected to SQLite database");

      // 确保初始化时创建表
      createTable();
    }
  });
};

/**
 * 创建表 `tb_address_receive`
 */
const createTable = (): void => {
  if (!db) {
    throw new Error("Database not initialized. Call initializeDB() first.");
  }

  const sql = `
    CREATE TABLE IF NOT EXISTS tb_address_receive (
      btc_address VARCHAR(64) PRIMARY KEY,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      tx_id VARCHAR(64),
      quote VARCHAR(64),
      update_time DATETIME,
      status INTEGER DEFAULT 0
    )`;

  db.run(sql, (err) => {
    if (err) {
      logger.error("Failed to create table:", err.message);
    } else {
      logger.info("Table 'tb_address_receive' created successfully");
    }
  });
};

const getDB = (): sqlite3.Database => {
  if (!db) {
    throw new Error("Database not initialized. Call initializeDB() first.");
  }
  return db;
};

/**
 * 插入一条数据
 */
const insertData = (btcAddress: string): void => {
  const sql = `INSERT INTO tb_address_receive (btc_address) VALUES (?)`;
  getDB().run(sql, [btcAddress], function (this: sqlite3.RunResult, err: Error | null) {
    if (err) {
      logger.error("Failed to insert data:", err.message);
    } else {
      logger.info("Data inserted successfully, Row ID:", this.lastID);
    }
  });
};

/**
 * 更新状态
 */
const updateStatus = (btcAddress: string, status: number): void => {
  const sql = `UPDATE tb_address_receive SET status = ?, update_time = DATETIME('now') WHERE btc_address = ?`;
  getDB().run(sql, [status, btcAddress], function (this: sqlite3.RunResult, err: Error | null) {
    if (err) {
      logger.error("Failed to update status:", err.message);
    } else {
      logger.info(`Status updated successfully, Rows affected: ${this.changes}`);
    }
  });
};

/**
 * 更新交易 ID
 */
const updateTxId = (btcAddress: string, txId: string): void => {
  const sql = `UPDATE tb_address_receive SET tx_id = ?, update_time = DATETIME('now') WHERE btc_address = ?`;
  getDB().run(sql, [txId, btcAddress], function (this: sqlite3.RunResult, err: Error | null) {
    if (err) {
      logger.error("Failed to update Tx ID:", err.message);
    } else {
      logger.info(`Tx ID updated successfully, Rows affected: ${this.changes}`);
    }
  });
};

/**
 * 更新状态和报价
 */
const updateStatusAndQuote = (btcAddress: string, status: number, quote: string): void => {
  const sql = `UPDATE tb_address_receive SET status = ?, quote = ?, update_time = DATETIME('now') WHERE btc_address = ?`;
  getDB().run(sql, [status, quote, btcAddress], function (this: sqlite3.RunResult, err: Error | null) {
    if (err) {
      logger.error("Failed to update status and quote:", err.message);
    } else {
      logger.info(`Status and quote updated successfully, Rows affected: ${this.changes}`);
    }
  });
};

/**
 * 更新报价
 */
const updateQuote = (btcAddress: string, quote: string): void => {
  const sql = `UPDATE tb_address_receive SET quote = ?, update_time = DATETIME('now') WHERE btc_address = ?`;
  getDB().run(sql, [quote, btcAddress], function (this: sqlite3.RunResult, err: Error | null) {
    if (err) {
      logger.error("Failed to update quote:", err.message);
    } else {
      logger.info(`Quote updated successfully, Rows affected: ${this.changes}`);
    }
  });
};

/**
 * 获取一条数据
 */
const getOneData = (): void => {
  const sql = `SELECT * FROM tb_address_receive WHERE status = 0 LIMIT 1`;
  getDB().get(sql, [], (err, row) => {
    if (err) {
      logger.error("Failed to fetch data:", err.message);
      return;
    }
    if (row) {
      logger.info("Record found:", row);
    } else {
      logger.info("No record found");
    }
  });
};

/**
 * 获取一条数据（返回 Promise）
 */
const getOneData2 = (): Promise<any[]> => {
  const sql = `SELECT * FROM tb_address_receive WHERE status = 0 LIMIT 1`;
  return new Promise((resolve, reject) => {
    getDB().all(sql, [], (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
};

/**
 * 获取总数
 */
const getTotal = (): Promise<any[]> => {
  const sql = `SELECT COUNT(1) AS total FROM tb_address_receive`;
  return new Promise((resolve, reject) => {
    getDB().all(sql, [], (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
};

/**
 * 根据地址查询数据
 */
const getOne = (address: string): Promise<any[]> => {
  const sql = `SELECT * FROM tb_address_receive WHERE btc_address = ?`;
  return new Promise((resolve, reject) => {
    getDB().all(sql, [address], (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
};

/**
 * 获取多条数据
 */
const getNoPaidRecords = (): Promise<any[]> => {
  const sql = `SELECT * FROM tb_address_receive WHERE status = 1 LIMIT 100`;
  return new Promise((resolve, reject) => {
    getDB().all(sql, [], (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
};


// 导出所有操作
export {
  insertData,
  updateStatus,
  updateTxId,
  updateStatusAndQuote,
  updateQuote,
  getOneData,
  getOneData2,
  getTotal,
  getOne,
  getNoPaidRecords,
};
