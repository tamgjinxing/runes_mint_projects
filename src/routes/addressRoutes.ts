import { Router, Request, Response } from "express";
import { createSuccessResponse, createErrorResponse } from "../responseHelper";
import * as sqlite3 from "../sqlite3";
import * as service from "../service";
import logger from "../logger";
import { RESPONSE } from "../constant";
import * as bitcoin from 'bitcoinjs-lib';

const router = Router();

router.get("/generateP2TRAddress", async (req: Request, res: Response) => {
    try {
        await service.genAddressAndStore();
        res.json(createSuccessResponse(null, "Address generated successfully"));
    } catch (error) {
        logger.error(error);
        res.status(RESPONSE.FAILED_CODE).json(createErrorResponse("Error generating address"));
    }
});

router.get("/getReceiveAddress", async (req: Request, res: Response) => {
    try {
        const address = await service.getAddressFromDB();
        sqlite3.updateStatus(address, 1);

        res.json(createSuccessResponse({
            address: address,
        }));
    } catch (error) {
        console.error(error);
        res.status(RESPONSE.FAILED_CODE).json(createErrorResponse("Error retrieving address"));
    }
});

router.get("/checkTransStatus", async (req: Request, res: Response) => {
    try {
        const txId = req.query.txId as string;
        const address = req.query.address as string;
        logger.info("查询参数:address=", address, ",txId=", txId);
        const row = await sqlite3.getOne(address);
        if (row && row.length > 0) {
            const response = {
                btcAddress: row[0].btc_address,
                status: row[0].status,
                update_time: row[0].update_time,
                txId: row[0].tx_id,
            };
            res.json(response);
        } else {
            res.send(
                "Successful! Cannot find any transactions on this address: " + address
            );
        }
    } catch (error) {
        logger.error(error);
        res.status(RESPONSE.FAILED_CODE).json(createErrorResponse("Error checking transaction status"));
    }
});

router.post("/saveTxId", (req: Request, res: Response) => {
    (async () => {
        try {
            const { txId, btcAddress } = req.body;
            if (!txId || !btcAddress) {
                return res.status(400).json(createErrorResponse("Required Parameter missing"));
            }
            sqlite3.updateTxId(btcAddress, txId);

            res.json(createSuccessResponse({}));
        } catch (error) {
            logger.error(error);
            return res.status(RESPONSE.FAILED_CODE).json(createErrorResponse("Save TxId Failed"));
        }
    })();
});

router.post('/saveQuote', (req: Request, res: Response) => {
    (async () => {
        try {
            const { quote, btcAddress } = req.body;

            if (!quote || !btcAddress) {
                return res.status(400).json(createErrorResponse("Required Parameter missing"));
            }

            sqlite3.updateQuote(btcAddress, quote);
            res.json(createSuccessResponse({}));
        } catch (error) {
            console.error(error);
            return res.status(RESPONSE.FAILED_CODE).json(createErrorResponse("Save Quote Failed"));
        }
    })();
});

router.get("/paid", async (req: Request, res: Response) => {
    try {
        const address = req.query.address as string;
        service.paid(address);
        res.json(createSuccessResponse({}, "Paid Successful"));
    } catch (error) {
        console.error(error);
        res.status(RESPONSE.FAILED_CODE).json(createErrorResponse("Paid Failed"));
    }
});


router.post("/create-psbt", async (req, res) => {
    const { toAddress, amount, feeRate } = req.body;
    try {
        const serverUTXOs: any[] = [];
        const serverChangeAddress = '1ServerAddressHere';

        const psbtBase64 = await createPSBTForUserWithFee(
            serverUTXOs,
            toAddress,
            amount,
            feeRate,
            serverChangeAddress
        );
        res.json({ psbt: psbtBase64 });
        const psbtData: { [key: string]: any } = {};
        psbtData["psbt"] = psbtBase64;

        res.json(createSuccessResponse({ data: psbtData }));
    } catch (error) {
        res.status(500).json({ error: error });
    }
});

async function createPSBTForUserWithFee(
    serverUTXOs: any[], // 服务器托管地址的 UTXO
    toAddress: string, // 用户的接收地址
    amountToSend: number, // 用户总支付金额（包括手续费）
    feeRate: number, // 每字节手续费费率 (sats/byte)
    serverChangeAddress: string // 找零地址
) {
    const network = bitcoin.networks.bitcoin; // 主网
    const psbt = new bitcoin.Psbt({ network });

    // 1. 估算交易大小
    const estimatedTxSize = 10 + serverUTXOs.length * 148 + 2 * 34 + 10; // 简单估算公式
    const fee = estimatedTxSize * feeRate; // 计算手续费（聪）

    // 2. 确保用户支付的金额足以覆盖手续费和转账金额
    if (amountToSend <= fee) {
        throw new Error('Amount is too small to cover transaction fee.');
    }

    const sendAmount = amountToSend - fee; // 转账金额去掉手续费

    // 3. 添加输入：从服务器地址选择 UTXO
    let totalInput = 0;
    for (const utxo of serverUTXOs) {
        psbt.addInput({
            hash: utxo.txid,
            index: utxo.vout,
            witnessUtxo: {
                script: Buffer.from(utxo.script, 'hex'),
                value: utxo.value,
            },
        });
        totalInput += utxo.value;

        if (totalInput >= amountToSend) break;
    }

    if (totalInput < amountToSend) {
        throw new Error('Insufficient balance in server address.');
    }

    // 4. 添加输出：转账到用户地址
    psbt.addOutput({
        address: toAddress,
        value: sendAmount, // 用户接收到的实际金额
    });

    // 5. 添加找零输出（如果有剩余）
    const changeAmount = totalInput - amountToSend;
    if (changeAmount > 0) {
        psbt.addOutput({
            address: serverChangeAddress,
            value: changeAmount,
        });
    }

    return {
        psbtBase64: psbt.toBase64(),
        fee,
        sendAmount,
    };
}

// 导出路由
export default router;
