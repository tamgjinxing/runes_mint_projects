const bitcoin = require('bitcoinjs-lib');
const bip39 = require('bip39');
const BIP32Factory = require('bip32').default;
const ecc = require('tiny-secp256k1');

// 初始化 ECC 库
bitcoin.initEccLib(ecc);

// 使用 tiny-secp256k1 初始化 bip32
const bip32 = BIP32Factory(ecc);

(async () => {
  // 1. 生成 BIP39 助记词和种子
  const mnemonic = config.mnemonic
  console.log('Mnemonic:', mnemonic);

  const seed = await bip39.mnemonicToSeed(mnemonic);

  // 2. 使用 BIP32 从种子生成根节点
  const root = bip32.fromSeed(seed, bitcoin.networks.bitcoin);

  // 3. 派生多个子密钥并生成对应的 Taproot 地址
  for (let i = 0; i < 2; i++) { // 生成 5 个子地址，可根据需要调整数量
    // 4. 按照 BIP86 路径派生出子密钥: m/86'/0'/0'/0/i
    const path = `m/86'/0'/0'/0/${i}`;
    const child = root.derivePath(path);

    // 获取公钥并生成 Taproot 地址 (P2TR)
    const { publicKey } = child;

    // 创建支付脚本，指定为 P2TR 格式
    const { address } = bitcoin.payments.p2tr({
      internalPubkey: publicKey.slice(1, 33), // 截取公钥的最后 32 字节
      network: bitcoin.networks.bitcoin,
    });

    console.log(`Taproot Address ${i} (bc1p): ${address}`);
  }
})();
