import * as ethers from "ethers";
import { signTypedData_v4 } from "eth-sig-util";
import { getChainData } from "../helpers/utilities";
import { setLocal, getLocal } from "../helpers/local";
import {
  ENTROPY_KEY,
  MNEMONIC_KEY,
  DEFAULT_ACTIVE_INDEX,
  DEFAULT_CHAIN_ID,
} from "../constants/default";
import { getAppConfig } from "../config";

declare global {
  var ethers: any; // eslint-disable-line no-var
  var wallet: ethers.Wallet; // eslint-disable-line no-var
  var provider: ethers.providers.Provider; // eslint-disable-line no-var
}
globalThis.ethers = ethers;

export class WalletController {
  public path: string;
  public entropy: string;
  public mnemonic: string;

  public activeIndex: number = DEFAULT_ACTIVE_INDEX;
  public activeChainId: number = DEFAULT_CHAIN_ID;

  constructor() {
    this.path = this.getPath();
    this.entropy = this.getEntropy();
    this.mnemonic = this.getMnemonic();
    globalThis.wallet = this.init();
  }

  public isActive() {
    if (!globalThis.wallet) {
      return globalThis.wallet;
    }
    return null;
  }

  public getAccounts(count = getAppConfig().numberOfAccounts) {
    const accounts = [];
    let wallet = null;
    for (let i = 0; i < count; i++) {
      wallet = this.generateWallet(i);
      accounts.push(wallet.address);
    }
    return accounts;
  }

  public getData(key: string): string {
    let value = getLocal(key);
    if (!value) {
      switch (key) {
        case ENTROPY_KEY:
          value = this.generateEntropy();
          break;
        case MNEMONIC_KEY:
          value = this.generateMnemonic();
          break;
        default:
          throw new Error(`Unknown data key: ${key}`);
      }
      setLocal(key, value);
    }
    return value;
  }

  public getPath(index: number = this.activeIndex) {
    this.path = `${getAppConfig().derivationPath}/${index}`;
    return this.path;
  }

  public generateEntropy(): string {
    this.entropy = ethers.utils.hexlify(ethers.utils.randomBytes(16));
    return this.entropy;
  }

  public generateMnemonic() {
    this.mnemonic = ethers.utils.entropyToMnemonic(this.getEntropy());
    return this.mnemonic;
  }

  public generateWallet(index: number) {
    globalThis.wallet = ethers.Wallet.fromMnemonic(this.getMnemonic(), this.getPath(index));
    return globalThis.wallet;
  }

  public getEntropy(): string {
    return this.getData(ENTROPY_KEY);
  }

  public getMnemonic(): string {
    return this.getData(MNEMONIC_KEY);
  }

  public init(index = DEFAULT_ACTIVE_INDEX, chainId = DEFAULT_CHAIN_ID): ethers.Wallet {
    return this.update(index, chainId);
  }

  public update(index: number, chainId: number): ethers.Wallet {
    const firstUpdate = typeof globalThis.wallet === "undefined";
    this.activeIndex = index;
    this.activeChainId = chainId;
    const rpcUrl = getChainData(chainId).rpc_url;
    const wallet = this.generateWallet(index);
    globalThis.provider = new ethers.providers.JsonRpcProvider(rpcUrl);
    globalThis.wallet = wallet.connect(globalThis.provider);
    if (!firstUpdate) {
      // update another controller if necessary here
    }
    return globalThis.wallet;
  }

  public async populateTransaction(transaction: any) {
    let tx = Object.assign({}, transaction);
    if (globalThis.wallet) {
      if (tx.gas) {
        tx.gasLimit = tx.gas;
        delete tx.gas;
      }
      if (tx.from) {
        tx.from = ethers.utils.getAddress(tx.from);
      }

      try {
        tx = await globalThis.wallet.populateTransaction(tx);
        tx.gasLimit = ethers.BigNumber.from(tx.gasLimit).toHexString();
        tx.gasPrice = ethers.BigNumber.from(tx.gasPrice).toHexString();
        tx.nonce = ethers.BigNumber.from(tx.nonce).toHexString();
      } catch (err) {
        console.error("Error populating transaction", tx, err);
      }
    }

    return tx;
  }

  public async sendTransaction(transaction: any) {
    if (globalThis.wallet) {
      if (
        transaction.from &&
        transaction.from.toLowerCase() !== globalThis.wallet.address.toLowerCase()
      ) {
        console.error("Transaction request From doesn't match active account");
      }

      if (transaction.from) {
        delete transaction.from;
      }

      // ethers.js expects gasLimit instead
      if ("gas" in transaction) {
        transaction.gasLimit = transaction.gas;
        delete transaction.gas;
      }

      const result = await globalThis.wallet.sendTransaction(transaction);
      return result.hash;
    } else {
      console.error("No Active Account");
    }
    return null;
  }

  public async signTransaction(data: any) {
    if (globalThis.wallet) {
      if (data && data.from) {
        delete data.from;
      }
      data.gasLimit = data.gas;
      delete data.gas;
      const result = await globalThis.wallet.signTransaction(data);
      return result;
    } else {
      console.error("No Active Account");
    }
    return null;
  }

  public async signMessage(data: any) {
    if (globalThis.wallet) {
      const signingKey = new ethers.utils.SigningKey(globalThis.wallet.privateKey);
      const sigParams = await signingKey.signDigest(ethers.utils.arrayify(data));
      const result = await ethers.utils.joinSignature(sigParams);
      return result;
    } else {
      console.error("No Active Account");
    }
    return null;
  }

  public async signPersonalMessage(message: any) {
    if (globalThis.wallet) {
      const result = await globalThis.wallet.signMessage(
        ethers.utils.isHexString(message) ? ethers.utils.arrayify(message) : message,
      );
      return result;
    } else {
      console.error("No Active Account");
    }
    return null;
  }

  public async signTypedData(data: any) {
    if (globalThis.wallet) {
      const result = signTypedData_v4(Buffer.from(globalThis.wallet.privateKey.slice(2), "hex"), {
        data: JSON.parse(data),
      });
      return result;
    } else {
      console.error("No Active Account");
    }
    return null;
  }
}

export function getWalletController() {
  return new WalletController();
}
