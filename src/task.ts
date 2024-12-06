import * as cron from 'node-cron';
import * as sqlite3 from './sqlite3';
import * as sqlite3other from './sqlite3other';
import * as callhttp from './callhttp';
import * as logic from './logic';
import logger from './logger';
import { UTXO, SubUTXO } from "./model";

async function checking(): Promise<void> {
    try {
        logger.info("正在检查是否有未到账记录");
        await getDataFromDB();
    } catch (error) {
        logger.error("检查数据库时出错:", error);
    }
}

function startTask(): void {
    // 每2分钟执行一次任务
    const task = cron.schedule('*/10 * * * *', checking);
    task.start(); // 启动任务
    logger.info("任务已启动,每10分钟检查一次数据库是否有未到账的记录到账了");
}

// 获取数据和处理数据的示例函数
async function getDataFromDB(): Promise<void> {
    const rows = await sqlite3.getNoPaidRecords();
    if (rows.length > 0) {
        for (const row of rows) {
            const address = row.btc_address;
            const txId = row.tx_id;
            const status = row.status;
            const quote = row.quote;

            let data = null;

            if (txId == null) {
                logger.info("table is not record txid");
            } else {
                // 调用接口获取交易信息
                data = await callhttp.getTransInfo(txId, address);
                logger.info("getTransInfo Result:", data);
            }

            let runeDatas: UTXO[] = [];

            if (data != null) {
                runeDatas = await logic.parseTxInfo(data, txId, address);
            } else {
                runeDatas = await logic.parseTxInfoNoData(address);
            }

            if (runeDatas.length > 0) {
                let total = 0;
                let spacedRune = "";

                for (const utxo of runeDatas) {
                    let txId = utxo.txid;
                    let btc_address = utxo.address;
                    let satoshi = utxo.satoshi;
                    let scriptPk = utxo.scriptPk;
                    let vout = utxo.vout;

                    if (utxo.runes.length > 0) {
                        for (const rune of utxo.runes) {
                            spacedRune = rune.spacedRune;
                            total += Number(rune.amount);

                            logger.info("收到符文Name:", spacedRune, "共", total, "个");
                        }

                        if (total > 0) {
                            sqlite3.updateStatusAndAmount(address, 2, total);

                            const currentDate = new Date();
                            const currentSeconds = currentDate.getSeconds();
                            sqlite3other.updateStatus(quote, 1, "PAID", currentSeconds);

                            logger.info("修改mint_quote表中quote=", quote, "的paid=1,state=paid");

                            const utxoBean: UTXO = {
                                address: address,
                                txid: txId,
                                vout: vout,
                                satoshi: satoshi,
                                scriptPk: scriptPk,
                                runes: utxo.runes
                            };

                            sqlite3.saveUTXO(utxoBean);
                        }
                    }
                }
            } else {
                logger.info("未找到确认到账的runes");
            }
        }
    } else {
        logger.info("No record was found to confirm the status of the account");
    }
}



// 导出所有操作
export { startTask, getDataFromDB };
