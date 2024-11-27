export interface UTXO {
    address: string;
    txid: string;
    satoshi: string;
    scriptPk: string;
    vout: number;
    runes: any[];
}

export const transformUTXO = (data: any): UTXO[] => {
    // 如果 data 不是数组，或其内部数据不符合预期，抛出错误或返回空数组
    if (!Array.isArray(data)) {
        console.error('Expected an array, but received:', data);
        return [];
    }

    // 遍历 data 数组
    return data.map((item: any) => ({
        address: item.address,
        txid: item.txid, // 将 txid 字符串转换为 Date 对象
        satoshi: item.satoshi.toString(), // 确保是字符串类型
        scriptPk: item.scriptPk,
        vout: item.vout,
        runes: item.runes || [], // 如果 runes 为 undefined，则返回空数组
    }));
}
