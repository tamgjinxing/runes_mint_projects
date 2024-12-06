import { Router, Request, Response } from "express";
import { createSuccessResponse, createErrorResponse } from "../responseHelper";
import * as sqlite3 from "../sqlite3";
import * as service from "../service";
import logger from "../logger";
import { RESPONSE } from "../constant";
import * as transferServeice from "../transfer/transferServeice";
import * as bitcoin from 'bitcoinjs-lib';
import ECPairFactory, { type ECPairInterface } from "ecpair";
import * as tinysecp from 'tiny-secp256k1';
import * as callhttp from "../callhttp";
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

router.get("/getRuneUTXOs", async (req: Request, res: Response) => {
    logger.info("Begin to getRuneUXTOs.");
    (async () => {
        try {
            const amount = req.query.amount as string;

            if (!amount) {
                return res.status(400).json(createErrorResponse("Required Parameter missing"));
            }

            const uxtos = await transferServeice.getTransferUTXOs(Number(amount));
            res.json(createSuccessResponse({ uxtos }));
        } catch (error) {
            console.error(error);
            return res.status(RESPONSE.FAILED_CODE).json(createErrorResponse("Save Quote Failed"));
        }
    })();
});

router.get("/getAddressBtcUTXOs", async (req: Request, res: Response) => {
    logger.info("Begin to getAddressBtcUTXOs.");
    (async () => {
        try {
            const address = req.query.address as string;
            const result = await callhttp.getAddressBTCUTXOs(address);
            res.json(createSuccessResponse({ result }));
        } catch (error) {
            console.error(error);
            return res.status(RESPONSE.FAILED_CODE).json(createErrorResponse("Get Address Btc UTXOs Failed"));
        }
    })();
});

router.post("/signPsbt", async (req: Request, res: Response) => {
    console.log("begin to signPsbt");
    (async () => {
        try {
            const { psbtHex,runeUTXOCount } = req.body;
            const signedPsbtHex = transferServeice.serverSignPsbt(psbtHex, runeUTXOCount);
            res.json(createSuccessResponse({signedPsbtHex}));
        } catch (error) {
            return res.status(RESPONSE.FAILED_CODE).json(createErrorResponse("sign-psbt Failed"));
        }
    })();
});



// 导出路由
export default router;
