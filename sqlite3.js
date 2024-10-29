const sqlite3 = require('sqlite3').verbose();

// 创建或连接数据库文件
const db = new sqlite3.Database('./database.db', (err) => {
  if (err) {
    console.error('连接数据库失败：', err.message);
  } else {
    console.log('成功连接到 SQLite 数据库');
  }
});

// 创建表 tb_address_receive
db.run(`CREATE TABLE IF NOT EXISTS tb_address_receive (
  btc_address TEXT PRIMARY KEY,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  update_time DATETIME,
  status INTEGER DEFAULT 0
)`, (err) => {
  if (err) {
    console.error('创建表失败：', err.message);
  } else {
    console.log('成功创建表 tb_address_receive');
  }
});

// 插入数据
const insertData = (btcAddress) => {
  const sql = `INSERT INTO tb_address_receive (btc_address) VALUES (?)`;
  db.run(sql, [btcAddress], function(err) {
    if (err) {
      return console.error('插入数据失败：', err.message);
    }
    console.log(`插入数据成功，行 ID: ${this.lastID}`);
  });
};

// 更新
const updateData = (btcAddress, status) => {
    // const currentTime = new Date().toISOString();
    const sql = `UPDATE tb_address_receive SET status = ?, update_time = DATETIME('now') WHERE btc_address = ?`;
    db.run(sql, [status, btcAddress], function(err) {
    if (err) {
      return console.error('更新数据失败：', err.message);
    }
    console.log(`更新数据成功，影响的行数: ${this.changes}`);
    });
};

const getOneData = () => {
    const sql = `SELECT * FROM tb_address_receive WHERE status = 0 limit 1`;
  
    db.get(sql, [], (err, row) => {
      if (err) {
        console.error('查询数据失败：', err.message);
        return;
      }
  
      if (row) {
        console.log('查询到的记录：', row);
        return row;
      } else {
        console.log('没有找到对应的记录');
        return null;
      }
    });
};

const getOneData2 = () => {
    return new Promise((resolve, reject) => {
        const sql = `SELECT * FROM tb_address_receive where status = 0 limit 1`;
        db.all(sql, [], (err, rows) => {
            if (err) {
                reject(err); // 查询失败，拒绝 Promise
            } else {
                resolve(rows); // 查询成功，返回数据
            }
        });
    });
};

// 导出所有操作
module.exports = {
  insertData,
  updateData,
  getOneData,
  getOneData2,
};
