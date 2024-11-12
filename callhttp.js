import HttpRequest from './httputils2.js';

const httpRequest = new HttpRequest();
const TOKEN = "a174f2f9ac9c2692117215e3c23acd01eb35d3d0e84d094e39f678884c644411";

 // 查询地址所有包含runes的utxo
 export async function getAddressUTXOs(address, runeId) {
    try {
        const url = "https://open-api.unisat.io/v1/indexer/address/" + address + "/runes/" + runeId + "/utxo"; // 接口地址，需替换为实际接口
        const headers = { Authorization: 'Bearer '+ TOKEN };
        const data = await httpRequest.get(url, headers);
        // console.log('GET Response:', data);
        return data;
    } catch (error) {
        console.error(error.message);
    }
}

// 查询地址所有包含runes的utxo
export async function getTransInfo(txId, address) {
    try {
        const url = "https://mempool.space/api/tx/" + txId;
        const headers = {};
        const data = await httpRequest.get(url, headers);
        // console.log('GET Response:', data);
        return data;
    } catch (error) {
        console.error(error.message);
    }
}