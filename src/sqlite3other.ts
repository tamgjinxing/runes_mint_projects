import sqlite3 from 'sqlite3';

const db = new sqlite3.Database(global.config.referMintDBPath, (err: Error | null) => {
    if (err) {
        console.error('连接数据库失败1：', err.message);
    } else {
        console.log('成功连接到 SQLite 数据库');
    }
});

// 更新状态函数
const updateStatus = (quote: string, isPaid: number, state: string, nowTime: number): void => {
    const sql = `UPDATE mint_quotes SET state = ?, paid_time = ?, paid=? WHERE quote = ?`;
    db.run(sql, [state, nowTime, isPaid, quote], function (this: sqlite3.RunResult, err: Error | null) { // 为 err 指定类型
        if (err) {
            console.error('更新数据失败：', err.message);
        } else {
            console.log(`更新数据成功，影响的行数: ${this.changes}`);
        }
    });
};

// 导出所有操作
export {
    updateStatus,
};