import {
    Transaction,
    script,
    Psbt,
    address as Address,
    initEccLib,
    networks,
    Signer as BTCSigner,
    crypto,
    payments,
    address,
} from "bitcoinjs-lib";
import { ECPairFactory, ECPairAPI } from "ecpair";
import ecc from "@bitcoinerlab/secp256k1";
import axios, { AxiosResponse } from "axios";
import { Rune, RuneId, Runestone, EtchInscription, none, some, Terms, Range, Etching, Edict } from "runelib";
import * as callhttp from '../callhttp';
import logger from '../logger';
import { UTXO, transformUTXO,AddressUTXOResult } from "../model";
import * as transferService from './transferServeice';

initEccLib(ecc as any);
declare const window: any;
const ECPair: ECPairAPI = ECPairFactory(ecc);
const network = networks.bitcoin;

export async function mintWithTaproot() {
    const btcKeyPair = ECPair.fromWIF(
        "cSj2jJRZEcTBA9M7Akti3PfNcDZdvE9wSM7stCxiPgmXNGuyUwrq",
        network
    );
    
    const runeKeyPair = ECPair.fromWIF(
        "cShKcUeRJonFZPHPvFFgSEX9dj995F5cxJ6SCaWhJuM9sVasNb13",
        network
    );

    const tweakedSigner = tweakSigner(btcKeyPair, { network });
    const p2pktr = payments.p2tr({
        pubkey: toXOnly(tweakedSigner.publicKey),
        network
    });
    const address = p2pktr.address ?? ""

    const runeTweakedSigner = tweakSigner(runeKeyPair, {network});

    const psbt = new Psbt({ network });

    //TODO 这里设置要转的runes数量和接收地址
    const transferCount: number  = 120;
    const receiveAddress = "tb1pxugggvh086zy8esww9rkj8gmrhr6325ahx4c82lcjgwxv6km40eqzzypvm"
    const changeAddress = "tb1pxugggvh086zy8esww9rkj8gmrhr6325ahx4c82lcjgwxv6km40eqzzypvm"
    const runeId = global.config.runeId;
    const [runeBlock, runeIdx] = runeId.split(":");

    const runeUtxos: UTXO[] = await transferService.getTransferUTXOs(transferCount);
    console.log(`Using runes UTXO len: ${runeUtxos.length}`);
    for (let i = 0; i < runeUtxos.length; i++) {
        const utxo = runeUtxos[i];
        psbt.addInput({
            hash: utxo.txid,
            index: utxo.vout,
            witnessUtxo: {
                script: Buffer.from(utxo.scriptPk, 'hex'),
                value: utxo.satoshi
            },
            tapInternalKey: toXOnly(runeKeyPair.publicKey)
        });
    }

    const result: AddressUTXOResult = await callhttp.getAddressBTCUTXOs("tb1pxugggvh086zy8esww9rkj8gmrhr6325ahx4c82lcjgwxv6km40eqzzypvm");
    const data = result.data;
    const btcUtxos = transformUTXO(data.utxo);

    for (let i = 0; i < btcUtxos.length; i++) {
        const utxo = btcUtxos[i];
        psbt.addInput({
            hash: utxo.txid,
            index: utxo.vout,
            witnessUtxo: {
                script: Buffer.from(utxo.scriptPk, 'hex'),
                value: utxo.satoshi
            },
            tapInternalKey: toXOnly(btcKeyPair.publicKey)
        });
    }

    const edicts: Array<Edict> = [];
    const edict: Edict = new Edict(new RuneId(Number(runeBlock), Number(runeIdx)), BigInt(transferCount), 1)
    edicts.push(edict)
    const mintstone = new Runestone(edicts, none(), none(), none());

    psbt.addOutput({
        script: mintstone.encipher(),
        value: 0
    });

    psbt.addOutput({
        address: receiveAddress, // rune receive address
        value: 546
    });

    const fee = 2500;

    // 计算总输入金额
    const totalInput = btcUtxos.reduce((acc, utxo) => acc + utxo.satoshi, 0);
    
    // 计算总输出金额（包括手续费和接收地址的最小金额）
    const totalRequired = fee + 546; // 546 是接收地址的最小金额
    
    // 检查输入是否足够
    if (totalInput < totalRequired) {
        throw new Error(`输入金额不足: 需要 ${totalRequired} satoshis, 但只有 ${totalInput} satoshis`);
    }
    
    // 计算找零金额
    const change = totalInput - totalRequired;
    
    // 只有当找零金额大于 0 时才添加找零输出
    if (change > 0) {
        psbt.addOutput({
            address: changeAddress,
            value: change
        });
    }

    await signAndSend2(tweakedSigner, psbt, address as string, runeTweakedSigner,runeUtxos.length, btcUtxos.length);
}


const blockstream = new axios.Axios({
    baseURL: `https://blockstream.info/api`
});

export async function waitUntilUTXO(address: string) {
    return new Promise<IUTXO[]>((resolve, reject) => {
        let intervalId: any;
        const checkForUtxo = async () => {
            try {
                const response: AxiosResponse<string> = await blockstream.get(`/address/${address}/utxo`);
                const data: IUTXO[] = response.data ? JSON.parse(response.data) : undefined;
                console.log(data);
                if (data.length > 0) {
                    resolve(data);
                    clearInterval(intervalId);
                }
            } catch (error) {
                reject(error);
                clearInterval(intervalId);
            }
        };
        intervalId = setInterval(checkForUtxo, 3000);
    });
}


export async function getTx(id: string): Promise<string> {
    const response: AxiosResponse<string> = await blockstream.get(`/tx/${id}/hex`);
    return response.data;
}


export async function signAndSend(keyPair: BTCSigner, psbt: Psbt, address: string) {
    if (process.env.NODE) {

        const keyPairRune = ECPair.fromWIF(
            "L2LL9ZeZsk5zPwp8XqSZ4v261VqjQnyvtFwy6A4Bonh9ckT2mZFG",
            network
        );
        psbt.signInput(0, keyPairRune);

        for (let i = 1; i < psbt.inputCount; i++) {
            psbt.signInput(i, keyPair);
        }

        psbt.finalizeAllInputs();
        const tx = psbt.extractTransaction();
        console.log(`Broadcasting Transaction Hex: ${tx.toHex()}`);
        const txid = await broadcast(tx.toHex());
        console.log(`Success! Txid is ${txid}`);
    } else { // in browser
        try {
            let res = await window.unisat.signPsbt(psbt.toHex(), {
                toSignInputs: [
                    {
                        index: 0,
                        address: address,
                    }
                ]
            });

            console.log("signed psbt", res)

            res = await window.unisat.pushPsbt(res);

            console.log("txid", res)
        } catch (e) {
            console.log(e);
        }
    }
}

export async function signAndSend2(keyPair: BTCSigner, psbt: Psbt, address: string, runeKeyPair: BTCSigner, runeUTXOCount: number, btcUTXOCount: number) {
    
    for (let i = 0; i < runeUTXOCount; i++) {
        psbt.signInput(i, runeKeyPair);
    }

    for(let i=0+runeUTXOCount; i < btcUTXOCount + runeUTXOCount; i++) {
        psbt.signInput(i, keyPair);
    }

    psbt.finalizeAllInputs();
    const tx = psbt.extractTransaction();
    console.log(`Broadcasting Transaction Hex: ${tx.toHex()}`);
    const txid = await broadcast(tx.toHex());
    console.log(`Success! Txid is ${txid}`);
}

export async function broadcast(txHex: string) {
    try{
        const response: AxiosResponse<string> = await blockstream.post('/tx', txHex);
        return response.data;
    }catch(error) {
        console.error("error", error)
    }
   
    return "";
    
}


function tapTweakHash(pubKey: Buffer, h: Buffer | undefined): Buffer {
    return crypto.taggedHash(
        "TapTweak",
        Buffer.concat(h ? [pubKey, h] : [pubKey])
    );
}

function toXOnly(pubkey: Buffer): Buffer {
    return pubkey.subarray(1, 33);
}

function tweakSigner(signer: BTCSigner, opts: any = {}): BTCSigner {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    let privateKey: Uint8Array | undefined = signer.privateKey!;
    if (!privateKey) {
        throw new Error("Private key is required for tweaking signer!");
    }
    if (signer.publicKey[0] === 3) {
        privateKey = ecc.privateNegate(privateKey);
    }

    const tweakedPrivateKey = ecc.privateAdd(
        privateKey,
        tapTweakHash(toXOnly(signer.publicKey), opts.tweakHash)
    );
    if (!tweakedPrivateKey) {
        throw new Error("Invalid tweaked private key!");
    }

    return ECPair.fromPrivateKey(Buffer.from(tweakedPrivateKey), {
        network: opts.network,
    });
}


interface IUTXO {
    txid: string;
    vout: number;
    value: number;

}