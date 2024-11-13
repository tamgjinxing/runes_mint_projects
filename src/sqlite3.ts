import sqlite3 from 'sqlite3';
import logger from './logger';

const db = new sqlite3.Database('./database.db', (err: Error | null) => {
  if (err) {
    logger.error("连接数据库失败:", err.message);
  } else {
    logger.info('成功连接到 SQLite 数据库');
  }
});


// 创建表 tb_address_receive
db.run(`CREATE TABLE IF NOT EXISTS tb_address_receive (
  btc_address varchar(64) PRIMARY KEY,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  tx_id varchar(64) ,
  update_time DATETIME,
  status INTEGER DEFAULT 0
)`, (err) => {
  if (err) {
    logger.error('创建表失败：', err.message);
  } else {
    logger.info('成功创建表tb_address_receive');
  }
});

// 插入数据函数
const insertData = (btcAddress: string): void => {
  const sql = `INSERT INTO tb_address_receive (btc_address) VALUES (?)`;
  db.run(sql, [btcAddress], function (this: sqlite3.RunResult, err: Error | null) { // 为 err 指定类型
    if (err) {
      logger.error("插入数据失败：", err.message);
    } else {
      logger.info("插入数据成功，行 ID:", this.lastID);
    }
  });
};

// 更新状态函数
const updateStatus = (btcAddress: string, status: number): void => {
  const sql = `UPDATE tb_address_receive SET status = ?, update_time = DATETIME('now') WHERE btc_address = ?`;
  db.run(sql, [status, btcAddress], function (this: sqlite3.RunResult, err: Error | null) { // 为 err 指定类型
    if (err) {
      logger.error('更新数据失败：', err.message);
    } else {
      logger.info(`更新数据成功，影响的行数: `, this.changes);
    }
  });
};

// 更新交易 ID 函数
const updateTxId = (btcAddress: string, txId: string): void => {
  const sql = `UPDATE tb_address_receive SET tx_id = ?, update_time = DATETIME('now') WHERE btc_address = ?`;
  db.run(sql, [txId, btcAddress], function (this: sqlite3.RunResult, err: Error | null) { // 为 err 指定类型
    if (err) {
      logger.error('更新数据失败：', err.message);
    } else {
      logger.info("更新数据成功，影响的行数:", this.changes);
    }
  });
};

// 其他代码保持不变
// 获取一条数据
const getOneData = (): void => {
  const sql = `SELECT * FROM tb_address_receive WHERE status = 0 limit 1`;

  db.get(sql, [], (err, row) => {
    if (err) {
      logger.error('查询数据失败：', err.message);
      return;
    }

    if (row) {
      logger.info('查询到的记录：', row);
      return row;
    } else {
      logger.info('没有找到对应的记录');
      return null;
    }
  });
};

// 获取一条数据（返回 Promise）
const getOneData2 = (): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    const sql = `SELECT * FROM tb_address_receive WHERE status = 0 limit 1`;
    db.all(sql, [], (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
};

// 根据地址查询数据
const getOne = (address: string): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    const sql = `SELECT * FROM tb_address_receive WHERE btc_address = ?`;
    db.all(sql, [address], (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
};

// 获取多条数据
const getDatas = (): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    const sql = `SELECT * FROM tb_address_receive WHERE status = 1 limit 100`;
    db.all(sql, [], (err, rows) => {
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
  getOneData,
  getOneData2,
  getDatas,
  getOne,
};