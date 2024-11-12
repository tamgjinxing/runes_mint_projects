const express = require('express');
const service = require('./service');
const sqlite3 = require('./sqlite3')
const task = require('./task')

const app = express();
const fs = require('fs');

const config = JSON.parse(fs.readFileSync('./config.json', 'utf8'));

app.use(express.json());

app.get('/generateP2TRAddress', async (req, res) => {
    try {
        const address = await service.generateReceiveAddress(config.mnemonic, 10);

        for (const subAddress of address) {
            sqlite3.insertData(subAddress)
        }
        res.send("Successful!!!");
    } catch (error) {
        console.error(error);
        res.status(500).send("Error generating address");
    }
});

app.get('/getReceiveAddress', async (req, res) => {
    try {
        
        row = await sqlite3.getOneData2();

        sqlite3.updateStatus(row[0].btc_address, 1)

        const json = {};
        const json1 = {};

        json.code = 200;
        json.msg = "success";

        json1.address = row[0].btc_address;
        json.data = json1;

        res.send(JSON.stringify(json, null, 2));
    } catch (error) {
        console.error(error);
        res.status(500).send("Error generating address");
    }
});

app.get('/checkTransStatus', async(req, res) => {
    try {
        const txId = req.query.txId; // 获取查询参数 query 的值
        const address = req.query.address;

        console.log('查询参数:address=', address, ",txId=", txId);

        row = await sqlite3.getOne(address);

        if (row != null) {
            if(row.length > 0 ){
                console.log("3333")

                let btcAddress = row[0].btc_address;
                let status = row[0].status;
                let update_time = row[0].update_time;
                let txId = row[0].tx_id;

                console.log("btcaddress:", btcAddress, "status:", status, "update_time:", update_time, "txId:", txId);
                res.send(JSON.stringify(row[0], null, 2));
            }else {
                console.log("44444")
            }
        }else {
            console.log("22222")
        }
    } catch (error) {
        console.error(error);
        res.status(500).send("Error generating address");
    }

    res.send("Successful!,can not find any transactions on this address:" + address)
});


app.post('/saveTxId', async (req, res) => {
    try {
        const { txId, btcAddress } = req.body;

        if (!txId || !btcAddress) {
            return res.status(400).send("缺少必要的参数");
        }

        const payload = {
            txId: txId,
            btcAddress: btcAddress
        };

        sqlite3.updateTxId(btcAddress, txId);

        const json = {};
        const json1 = {};

        json.code = 200;
        json.msg = "success";

        res.send(JSON.stringify(json, null, 2));
    } catch (error) {
        console.error(error);
        res.status(500).send("保存txid出错");
    }
});

task.startTask();

app.listen(3000, () => {
    console.log("Server running on port http://localhost:3000");
});