import express, { Request, Response } from "express";
import * as service from "./service";
import * as sqlite3 from "./sqlite3";
import * as task from "./task";
import fs from "fs";
import logger from "./logger";

const app = express();

interface Config {
  port: string;
  mnemonic: string;
}

const config: Config = JSON.parse(fs.readFileSync("./config.json", "utf8"));

app.use(express.json());

app.get("/generateP2TRAddress", async (req: Request, res: Response) => {
  try {
    const addressSet = await service.generateReceiveAddress(
      config.mnemonic,
      10
    );
    for (const subAddress of addressSet) {
      await sqlite3.insertData(subAddress);
    }
    res.send("Successful!!!");
  } catch (error) {
    console.error(error);
    res.status(500).send("Error generating address");
  }
});

app.get("/getReceiveAddress", async (req: Request, res: Response) => {
  try {
    const row = await sqlite3.getOneData2();
    if (row && row.length > 0) {
      await sqlite3.updateStatus(row[0].btc_address, 1);

      const responseJson = {
        code: 200,
        msg: "success",
        data: {
          address: row[0].btc_address,
        },
      };

      res.json(responseJson);
    } else {
      res.status(404).send("No available addresses");
    }
  } catch (error) {
    console.error(error);
    res.status(500).send("Error retrieving address");
  }
});

app.get("/checkTransStatus", async (req: Request, res: Response) => {
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
    res.status(500).send("Error checking transaction status");
  }
});

app.post("/saveTxId", (req: Request, res: Response) => {
  (async () => {
    try {
      const { txId, btcAddress } = req.body;
      if (!txId || !btcAddress) {
        return res.status(400).send("缺少必要的参数");
      }
      await sqlite3.updateTxId(btcAddress, txId);
      const responseJson = {
        code: 200,
        msg: "success",
      };

      res.json(responseJson);
    } catch (error) {
      logger.error(error);
      res.status(500).send("保存 txid 出错");
    }
  })();
});

task.startTask();

const port = config.port;

app.listen(port, () => {
  logger.info("Server running on port http://localhost:" + port);
});
