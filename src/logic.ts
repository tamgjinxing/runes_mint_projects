import * as callhttp from './callhttp';

const mempool_interface_tx_url = "https://mempool.space/api/tx/";
const unisat_interface_unisat_utxo_url = "https://open-api.unisat.io/v1/indexer/address/";   
const bear_token = "a174f2f9ac9c2692117215e3c23acd01eb35d3d0e84d094e39f678884c644411";
const renuId = "840000:28";

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
                console.log("匹配地址，调用接口 GetRunesBalance!!!", targetAddress);
                
                // 调用接口获取结果
                const result: AddressUTXOResult = await callhttp.getAddressUTXOs(targetAddress, renuId);
        
                // 获取数据的属性
                const data = result.data;
        
                // 使用 for 循环替代 data.utxo.forEach
                for (const utxo of data.utxo) {
                    renuDatas.push(...utxo.runes);
                }
        
                console.log("renuDatas:", renuDatas);
            }
        }
    } else {
        console.log("还未确认");
    }
    
    return renuDatas;
}

async function parseTxInfoNoData(address: string): Promise<any[]> {
    const renuDatas: any[] = []; // 根据具体的数据结构替换 any 类型
    console.log("匹配地址，调用接口 GetRunesBalance!!!", address);
                
    // 调用接口获取结果
    const result: AddressUTXOResult = await callhttp.getAddressUTXOs(address, renuId);

    // 获取数据的属性
    const data = result.data;

    // 使用 for 循环替代 data.utxo.forEach
    for (const utxo of data.utxo) {
        renuDatas.push(...utxo.runes);
    }

    console.log("renuDatas:", renuDatas);
    
    return renuDatas;
}

// 导出所有操作
export { parseTxInfo, parseTxInfoNoData };
