import * as cron from 'node-cron';
import * as sqlite3 from './sqlite3';
import * as callhttp from './callhttp';
import * as logic from './logic';

async function checking(): Promise<void> {
    try {
        console.log("正在检查是否有未到账记录");
        await getDataFromDB();
    } catch (error) {
        console.error("检查数据库时出错:", error);
    }
}

function startTask(): void {
    // 每2分钟执行一次任务
    const task = cron.schedule('*/2 * * * *', checking);
    task.start(); // 启动任务
    console.log("任务已启动，每2分钟检查一次数据库");
}

// 获取数据和处理数据的示例函数
async function getDataFromDB(): Promise<void> {
    const rows = await sqlite3.getDatas();
    if (rows.length > 0) {
        for (const row of rows) {
            const address = row.btc_address;
            const txId = row.tx_id;
            const statuss = row.status;
    
            let data = null;
    
            if (txId == null) {
                console.log("table is not record txid");
            }else {
                // 调用接口获取交易信息
                data = await callhttp.getTransInfo(txId, address);
                console.log("getTransInfo Result:", data);
            }
    
            let runeDatas = null;
            if( data != null) {
                runeDatas = await logic.parseTxInfo(data, txId, address);
            }else {
                runeDatas = await logic.parseTxInfoNoData(address);
            }
            if (runeDatas.length > 0) {
                let total = 0;
                let spacedRune = "";
    
                for (const rune of runeDatas) {
                    spacedRune = rune.spacedRune;
                    total += Number(rune.amount);
                }
                console.log("收到符文Name:", spacedRune, "共", total, "个");
    
                if (total > 0) {
                    sqlite3.updateStatus(address, 2);
                }
            }else {
                console.log("未找到确认到账的runes")
            }
        }
    }else {
        console.log("没有找到需要确认到账状态的记录")
    }
}

// 导出所有操作
export { startTask,getDataFromDB };
