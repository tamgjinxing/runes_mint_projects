import HttpRequest from './httputils2';

const httpRequest = new HttpRequest();
const TOKEN = "a174f2f9ac9c2692117215e3c23acd01eb35d3d0e84d094e39f678884c644411";

// 查询地址所有包含 runes 的 UTXO
export async function getAddressUTXOs(address: string, runeId: string): Promise<any> {
    try {
        const url = `https://open-api.unisat.io/v1/indexer/address/${address}/runes/${runeId}/utxo`; // 接口地址
        const headers = { Authorization: `Bearer ${TOKEN}` };
        const data = await httpRequest.get(url, headers);
        return data;
    } catch (error: any) {
        console.error(error.message);
    }
}

// 查询交易信息
export async function getTransInfo(txId: string, address: string): Promise<any> {
    try {
        const url = `https://mempool.space/api/tx/${txId}`;
        const headers = {};
        const data = await httpRequest.get(url, headers);
        return data;
    } catch (error: any) {
        console.error(error.message);
    }
}