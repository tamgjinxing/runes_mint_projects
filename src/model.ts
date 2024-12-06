export interface UTXO {
    address: string;
    txid: string;
    satoshi: number;
    scriptPk: string;
    vout: number;
    runes: SubUTXO[];
}

export interface AddressUTXOResult {
    data: {
        utxo: RuneUtxo[];
    };
}

// 定义数据类型
export interface TxStatus {
    confirmed: boolean;
}

export interface TxVout {
    scriptpubkey_address: string;
}

export interface Tx {
    txid: string;
    fee: number;
    status: TxStatus;
    vout: TxVout[];
}

export interface RuneUtxo {
    runes: any[]; // 根据具体的 runes 数据结构替换 any 类型
}

export interface SubUTXO {
    rune: string,
    runeId: string,
    spacedRune: string,
    amount: string,
    symbol: string,
    divisibility: number
}

export interface AddressIndexBean {
    index: number,
    address: string
}

export const transformUTXO = (data: any): UTXO[] => {
    if (!Array.isArray(data)) {
        console.error('Expected an array, but received:', data);
        return [];
    }

    return data.map((item: any) => ({
        address: item.address,
        txid: item.txid, // 将 txid 字符串转换为 Date 对象
        satoshi: item.satoshi, // 确保是字符串类型
        scriptPk: item.scriptPk,
        vout: item.vout,
        runes: item.runes || [], // 如果 runes 为 undefined，则返回空数组
    }));
}

// 抽取的函数，用于将查询结果转换为 UTXO 数组
export const transRowsToBean = (rows: any[]): UTXO[] => {
    return rows.map((row: any) => ({
        address: row.btc_address,
        txid: row.txid,
        satoshi: row.satoshi,
        scriptPk: row.scriptPk,
        vout: row.vout,
        runes: row.runes || [],  // 如果没有 runes，则返回空数组
    }));
};