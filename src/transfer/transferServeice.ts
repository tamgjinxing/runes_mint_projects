import * as sqlite3 from "../sqlite3";
import * as models from "../model";
import * as bitcoin from 'bitcoinjs-lib';
import logger from "../logger";
import { ECPairFactory,ECPairAPI } from "ecpair";
import ecc from "@bitcoinerlab/secp256k1";
import { getPrivateByMnemonic } from "../service";

bitcoin.initEccLib(ecc as any);
declare const window: any;
const ECPair: ECPairAPI = ECPairFactory(ecc);
const network = bitcoin.networks.bitcoin;

/**
 * 
 * @param runeCount utxo获取规则
 * 先从=开始
 * 再从>中获取
 * 实在没有的话，从小的拼接
 */
export async function getTransferUTXOs(runeCount: number): Promise<models.UTXO[]> {
    let rows = await sqlite3.getUTXOsAddressEquals(runeCount);

    if (rows.length == 0) {
        rows = await sqlite3.getUTXOsAddressBigger(runeCount);

        if (rows.length == 0) {
            //TODO 取各种小于某数字的2-4个utxo
            rows = await sqlite3.getUTXOsAddressLessThan(runeCount);
        }
    }

    return models.transRowsToBean(rows);
}

export function serverSignPsbt(psbtHex: string, runeUTXOCount: number): string {
    try{
        // 从传入的 hex 字符串创建 PSBT 对象
        const psbt = bitcoin.Psbt.fromHex(psbtHex);
        const serverPrivateKeyWIF = getPrivateByMnemonic(global.config.mnemonic);
        // 使用服务器的私钥创建 ECPair
        const keyPair = ECPair.fromWIF(serverPrivateKeyWIF, bitcoin.networks.bitcoin);

        // 对所有utxo输入进行签名
        for (let i = 0; i < runeUTXOCount; i++) {
            psbt.signInput(i, keyPair);
        }

        // 返回签名后的 PSBT 的 hex 字符串
        return psbt.toHex();
    }catch(error) {
        console.log(error)
    }
    return "";
}