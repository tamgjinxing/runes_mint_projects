const callhttp = require('./callhttp');

const mempool_interface_tx_url = "https://mempool.space/api/tx/"
const unisat_interface_unisat_utxo_url = "https://open-api.unisat.io/v1/indexer/address/";   
const bear_token = "a174f2f9ac9c2692117215e3c23acd01eb35d3d0e84d094e39f678884c644411";
const renuId = "840000:28";

async function parseTxInfo(tx, txId, targetAddress){
    console.log("Transaction ID:", tx.txid);
    console.log("Fee:", tx.fee);
    console.log("Status confirmed:", tx.status.confirmed);

    const renuDatas = [];

    if (tx.status.confirmed) {
        for (let i = 0; i < tx.vout.length; i++) {
            const vout = tx.vout[i];
            if (vout.scriptpubkey_address === targetAddress) {
                console.log("匹配地址，调用接口 GetRunesBalance!!!", targetAddress);
                
                // 调用接口获取结果
                let result = await callhttp.getAddressUTXOs(targetAddress, renuId);
        
                // 获取数据的属性
                const data = result.data;
        
                // 使用 for 循环替代 data.utxo.forEach
                for (let j = 0; j < data.utxo.length; j++) {
                    renuDatas.push(...data.utxo[j].runes);
                }
        
                console.log("renuDatas:", renuDatas);
            }
        }
        
	}else {
        console.log("还未确认")
    }
    return renuDatas;
}

// 导出所有操作
module.exports = {
    parseTxInfo
};