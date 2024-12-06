import sqlite3 from "sqlite3";
import logger from "./logger";
import { UTXO, AddressIndexBean } from "./model";

let db: sqlite3.Database | null = null;

// 初始化数据库连接
export const initializeDB = (): Promise<void> => {
  return new Promise((resolve, reject) => {
      const path = global.config.runeMintDBPath;
      logger.info("Database path:", path);

      if (!path) {
          const error = new Error("数据库路径未定义");
          logger.error(error.message);
          reject(error);
          return;
      }

      try {
          db = new sqlite3.Database(path, (err: Error | null) => {
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

/**
 * 创建表 `tb_address_receive`
 */
const createTables = (): void => {
  if (!db) {
    throw new Error("Database not initialized. Call initializeDB() first.");
  }

  const tables = [
    {
      name: "tb_address_receive",
      sql: `
        CREATE TABLE IF NOT EXISTS tb_address_receive (
          address_index number default 1,
          btc_address VARCHAR(64) PRIMARY KEY,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          tx_id VARCHAR(64),
          quote VARCHAR(64),
          amount DOUBLE DEFAULT 0,
          update_time DATETIME,
          status INTEGER DEFAULT 0
        )`,
    },
    {
      name: "tb_address_utxos",
      sql: `
        CREATE TABLE IF NOT EXISTS tb_address_utxos (
          txid varchar(64) PRIMARY KEY,  
          btc_address VARCHAR(64) default null, 
          vout INTEGER ,
          scriptPk VARCHAR(64)   ,
          satoshi number,
          runes TEXT
        )`,
    },
  ];

  tables.forEach((table) => {
    getDB().run(table.sql, (err) => {
      if (err) {
        logger.error(`Failed to create table '${table.name}':`, err.message);
      } else {
        logger.info(`Table '${table.name}' created successfully`);
      }
    });
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
const insertData = (addressIndexBean: AddressIndexBean): void => {
  const sql = `INSERT INTO tb_address_receive (address_index, btc_address) VALUES (?,?)`;
  getDB().run(sql, [addressIndexBean.index, addressIndexBean.address], function (this: sqlite3.RunResult, err: Error | null) {
    if (err) {
      logger.error("Failed to insert data:", err.message);
    } else {
      logger.info("Data inserted successfully, Row ID:", this.lastID);
    }
  });
};

const saveUTXO = (utxoBean: UTXO): void => {
  const sql = `INSERT INTO tb_address_utxos (txid,btc_address,vout,scriptPk,satoshi,runes) VALUES (?,?,?,?,?,?)`;
  getDB().run(sql, [utxoBean.txid, utxoBean.address, utxoBean.vout, utxoBean.scriptPk, utxoBean.satoshi, JSON.stringify(utxoBean.runes)], function (this: sqlite3.RunResult, err: Error | null) {
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

const updateStatusAndAmount = (btcAddress: string, status: number, amount: number): void => {
  const sql = `UPDATE tb_address_receive SET status = ?,amount=? , update_time = DATETIME('now') WHERE btc_address = ?`;
  getDB().run(sql, [status, amount, btcAddress], function (this: sqlite3.RunResult, err: Error | null) {
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
  const sql = `SELECT * FROM tb_address_receive WHERE status = 0 order by address_index asc  LIMIT 1`;
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
  const sql = `SELECT * FROM tb_address_receive WHERE status = 1 LIMIT 1`;
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


const getUTXOsAddressEquals = (runeCount: number): Promise<any[]> => {
  // SELECT a.btc_address,b.txid,b.vout,b.scriptPk, b.satoshi FROM tb_address_receive a left join tb_address_utxo b on a.btc_address = b.btc_address WHERE a.status = 2 and a.amount = ? limit 1
  // const sql = `SELECT * FROM tb_address_receive WHERE status = 2 and amount = ? limit 1`;
  const sql = "SELECT a.btc_address,b.txid,b.vout,b.scriptPk, b.satoshi,b.runes FROM tb_address_receive a left join tb_address_utxos b on a.btc_address = b.btc_address WHERE a.status = 2 and a.amount = ? limit 1";

  return new Promise((resolve, reject) => {
    getDB().all(sql, [runeCount], (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
};

const getUTXOsAddressBigger = (runeCount: number): Promise<any[]> => {
  //sql = SELECT a.btc_address,b.txid,b.vout,b.scriptPk, b.satoshi FROM tb_address_receive a left join tb_address_utxo b on a.btc_address = b.btc_address WHERE a.status = 2 and a.amount > ? order by a.amount asc limit 1
  const sql = `SELECT * FROM tb_address_receive WHERE status = 2 and amount > ? order by amount asc limit 1`;
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

const getUTXOsAddressLessThan = (runeCount: number): Promise<any[]> => {
  //sql = SELECT a.btc_address,b.txid,b.vout,b.scriptPk, b.satoshi FROM tb_address_receive a left join tb_address_utxo b on a.btc_address = b.btc_address WHERE a.status = 2 and a.amount < ? 
  const sql = `SELECT * FROM tb_address_receive WHERE status = 2 and amount < ? `;
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

// 查找满足条件的记录
const findClosestRecords = (targetAmount: number) => {
  return new Promise<any[]>((resolve, reject) => {
    // Step 1: 查找 amount = targetAmount 的记录
    getDB().all('SELECT * FROM tb_address_receive WHERE amount = ?', [targetAmount], (err, rows) => {
      if (err) {
        reject(err);
        return;
      }

      // 如果找到了，直接返回这些记录
      if (rows.length > 0) {
        resolve(rows);
        return;
      }

      // Step 2: 如果没有，查找 amount > targetAmount 的记录
      getDB().all('SELECT * FROM tb_address_receive WHERE amount > ? LIMIT 1', [targetAmount], (err, rows) => {
        if (err) {
          reject(err);
          return;
        }

        // 如果找到了，返回这个记录
        if (rows.length > 0) {
          resolve(rows);
          return;
        }

        // Step 3: 如果没有，查找与 targetAmount 之差最小的记录
        getDB().all('SELECT *, ABS(amount - ?) AS diff FROM tb_address_receive ORDER BY diff LIMIT 5', [targetAmount], (err, rows) => {
          if (err) {
            reject(err);
            return;
          }

          resolve(rows); // 返回最接近的记录，最多返回 5 行
        });
      });
    });
  });
};


// 导出所有操作
export {
  insertData,
  updateStatus,
  updateStatusAndAmount,
  updateTxId,
  updateStatusAndQuote,
  updateQuote,
  getOneData,
  getOneData2,
  getTotal,
  getOne,
  getNoPaidRecords,
  getUTXOsAddressBigger,
  getUTXOsAddressEquals,
  saveUTXO,
  findClosestRecords,
  getUTXOsAddressLessThan
};
