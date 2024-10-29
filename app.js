const express = require('express');
const service = require('./service');
const sqlite3 = require('./sqlite3')
const httputils2 = require('./httputils');

const app = express();
const fs = require('fs');

const config = JSON.parse(fs.readFileSync('./config.json', 'utf8'));

console.log(config.mnemonic)

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

       sqlite3.updateData(row[0].btc_address, 1)

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

app.get('/checkTransaction', async(req, res) => {
    try {
        // 调用 GET 请求示例
        httputils2.makeGetRequest('https://mempool.space/api/tx/272878eafa84fac3b161723b05758443fc87f905b776c6bac1654b299ec7e66a')
        .then((data) => {
            console.log('接收到的数据:', data);


        })
        .catch((error) => {
            console.error('请求错误:', error);
        });
    } catch (error) {
        console.error(error);
        res.status(500).send("Error generating address");
    }
});


// 调用 GET 请求示例
httputils2.makeGetRequest('https://mempool.space/api/tx/272878eafa84fac3b161723b05758443fc87f905b776c6bac1654b299ec7e66a')
.then((data) => {
    console.log('接收到的数据:', data);
})
.catch((error) => {
    console.error('请求错误:', error);
});

app.listen(3000, () => {
    console.log("Server running on port http://localhost:3000");
});