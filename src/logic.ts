import * as callhttp from './callhttp';
import logger from './logger';

// 定义数据类型
interface TxStatus {
    confirmed: boolean;
}

interface TxVout {
    scriptpubkey_address: string;
}

interface Tx {
    txid: string;
    fee: number;
    status: TxStatus;
    vout: TxVout[];
}

interface RuneUtxo {
    runes: any[]; // 根据具体的 runes 数据结构替换 any 类型
}

interface AddressUTXOResult {
    data: {
        utxo: RuneUtxo[];
    };
}

async function parseTxInfo(tx: Tx, txId: string, targetAddress: string): Promise<any[]> {
    const renuDatas: any[] = []; // 根据具体的数据结构替换 any 类型
    if (tx != null && tx.status.confirmed) {
        for (const vout of tx.vout) {
            if (vout.scriptpubkey_address === targetAddress) {
                logger.info("匹配地址，调用接口 GetRunesBalance!!!", targetAddress);

                // 调用接口获取结果
                const result: AddressUTXOResult = await callhttp.getAddressUTXOs(targetAddress, global.config.runeId);

                // 获取数据的属性
                const data = result.data;

                // 使用 for 循环替代 data.utxo.forEach
                for (const utxo of data.utxo) {
                    renuDatas.push(...utxo.runes);
                }
                logger.info("renuDatas:", renuDatas);
            }
        }
    } else {
        logger.info("还未确认")
    }

    return renuDatas;
}

async function parseTxInfoNoData(address: string): Promise<any[]> {
    const renuDatas: any[] = []; // 根据具体的数据结构替换 any 类型
    logger.info("匹配地址，调用接口 GetRunesBalance!!!", address);

    // 调用接口获取结果
    const result: AddressUTXOResult = await callhttp.getAddressUTXOs(address, global.config.runeId);

    // 获取数据的属性
    const data = result.data;

    // 使用 for 循环替代 data.utxo.forEach
    for (const utxo of data.utxo) {
        renuDatas.push(...utxo.runes);
    }

    logger.info("renuDatas:", renuDatas);

    return renuDatas;
}

// 导出所有操作
export { parseTxInfo, parseTxInfoNoData };
