import * as sqlite3 from "../sqlite3";

async function getTransferUTXOs(runeCount: number) {
    const rows = await sqlite3.getUTXOsAddressEquals(runeCount);

    if (rows.length > 0) {
        for (const row of rows) {
            const address = row.btc_address;
        }
    }
}