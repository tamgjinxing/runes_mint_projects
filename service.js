const bitcoin = require('bitcoinjs-lib');
const bip39 = require('bip39');
const BIP32Factory = require('bip32').default;
const ecc = require('tiny-secp256k1');

// 初始化 ECC 库
bitcoin.initEccLib(ecc);

// 使用 tiny-secp256k1 初始化 bip32
const bip32 = BIP32Factory(ecc);

// 异步函数，用于生成地址
async function generateReceiveAddress(mnemonic, index) {
  const seed = await bip39.mnemonicToSeed(mnemonic);

  // 2. 使用 BIP32 从种子生成根节点
  const root = bip32.fromSeed(seed, bitcoin.networks.bitcoin);
  const resultSet = new Set();

  for(i=0;i< index; i++) {
    const path = `m/86'/0'/0'/0/`+ i ;
    const child = root.derivePath(path);

    // 获取公钥并生成 Taproot 地址 (P2TR)
    const { publicKey } = child;

    // 创建支付脚本，指定为 P2TR 格式
    const { address } = bitcoin.payments.p2tr({
      internalPubkey: publicKey.slice(1, 33), // 截取公钥的最后 32 字节
      network: bitcoin.networks.bitcoin,
    });

    console.log(`Taproot Address (bc1p): ${address}`);

    resultSet.add(address)
  }
  
  return resultSet;
}

function generateRandomNumber() {
  const now = Date.now(); // 当前时间的毫秒数
  const random = Math.floor((now * Math.random()) % 999999); // 生成小于999999的随机数
  return random;
}

module.exports = { generateReceiveAddress };