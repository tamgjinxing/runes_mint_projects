import * as bitcoin from 'bitcoinjs-lib';
import * as bip39 from 'bip39';
import BIP32Factory from 'bip32';
import * as ecc from 'tiny-secp256k1';
import logger from './logger';
import * as sqlite3 from "./sqlite3";
import * as sqlite3other from './sqlite3other';

// 初始化 ECC 库
bitcoin.initEccLib(ecc);

// 使用 tiny-secp256k1 初始化 bip32
const bip32 = BIP32Factory(ecc);

// 定义生成地址的异步函数
async function generateReceiveAddress(mnemonic: string, index: number, existCount: number): Promise<Set<string>> {
  const seed = await bip39.mnemonicToSeed(mnemonic);

  // 使用 BIP32 从种子生成根节点
  const root = bip32.fromSeed(seed, bitcoin.networks.bitcoin);
  const resultSet = new Set<string>();

  logger.info("existCount::::::", existCount);
  for (let i = 1; i <= index + existCount; i++) {
    if (i <= existCount) {
      continue;
    }
    const path = `m/86'/0'/0'/0/${i}`;
    const child = root.derivePath(path);

    // 获取公钥并生成 Taproot 地址 (P2TR)
    const { publicKey } = child;

    // 创建支付脚本，指定为 P2TR 格式
    const { address } = bitcoin.payments.p2tr({
      internalPubkey: publicKey.slice(1, 33), // 截取公钥的最后 32 字节
      network: bitcoin.networks.bitcoin,
    });

    if (address) {
      logger.info("Taproot Address (bc1p):", address);
      resultSet.add(address);
    }
  }

  return resultSet;
}

// 生成随机数函数
function generateRandomNumber(): number {
  const now = Date.now(); // 当前时间的毫秒数
  const random = Math.floor((now * Math.random()) % 999999); // 生成小于999999的随机数
  return random;
}

async function genAddressAndStore() {
  const row = await sqlite3.getTotal();
  const existCount = row[0].total;
  const addressSet = await generateReceiveAddress(
    global.config.mnemonic,
    global.config.defaultAddressCount,
    existCount
  );
  for (const subAddress of addressSet) {
    sqlite3.insertData(subAddress);
  }
}

async function getAddressFromDB(): Promise<string> {
  // 还有未使用的地址
  while (true) {
    const row = await sqlite3.getOneData2(); // 从数据库获取一条数据

    if (row && row.length > 0) {
      // 如果有数据，更新状态并返回地址
      sqlite3.updateStatus(row[0].btc_address, 1);
      return row[0].btc_address;
    } else {
      // 如果没有数据，生成新的地址

      await genAddressAndStore();
    }
  }
}

async function paid(address: string): Promise<void> {
  const rows = await sqlite3.getOne(address);
  if (rows.length > 0) {
    for (const row of rows) {
      const address = row.btc_address;
      const txId = row.tx_id;
      const status = row.status;
      const quote = row.quote;

      sqlite3.updateStatus(address, 2);

      const timestampInSeconds = Math.floor(Date.now() / 1000);
      sqlite3other.updateStatus(quote, 1, "PAID", timestampInSeconds)
    }
  }
}

export { generateReceiveAddress, generateRandomNumber, genAddressAndStore, getAddressFromDB, paid };
