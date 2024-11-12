const cron = require('node-cron');
const sqlite3 = require('./sqlite3');
const callhttp = require('./callhttp');
const logic = require('./logic');

async function checking() {
    try {
        console.log("正在检查是否有未到账记录");
        const data = await getDataFromDB();
        if (data != null) {
            await processData(data);
        }
    } catch (error) {
        console.error("检查数据库时出错:", error);
    }
}
function startTask() {
    // 每2分钟执行一次任务
    const task = cron.schedule('*/2 * * * *', checking);
    task.start(); // 启动任务
    console.log("任务已启动，每2分钟检查一次数据库");
}

// 示例的获取数据和处理数据函数
async function getDataFromDB() {
    rows = await sqlite3.getDatas();
    rows.forEach(async (row) => {
        address = row.btc_address;
        txId = row.tx_id;
        statuss = row.status;

        // let address = "bc1pnykdyuqhd7krpn7wa3j3j7zn54wgtvp3ar9caz5ygx0503kfckdq7fppvp";
        // let txId  = "f0ce9a1983fdb89ea40415b526bbfba330f03c9d8446beebe2bdb357b120e7ac";

        data = await callhttp.getTransInfo(txId,address);
        console.log("getTransInfo Result:", data)

        runeDatas = await logic.parseTxInfo(data, txId, address);

        if (runeDatas.length > 0) {
            total = 0
            spacedRune = ""
    
            for (let i = 0; i < runeDatas.length; i++) {
                const rune = runeDatas[i];
                spacedRune = runeDatas[i].spacedRune
                total = total + Number(rune.amount)
            }
            console.log("收到符文Name:", spacedRune, "共" ,total , "个")

            if (total > 0) {
                sqlite3.updateStatus("bc1phk7kmfwnyx4clrwy45876f25dazr5gzn6w46mfqajd6x7cf07gyq827rz4", 2)
            }
        }
    });
}

// 导出所有操作
module.exports = {
    startTask
};