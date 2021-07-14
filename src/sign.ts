import { recoverPersonalSignature, recoverTypedMessage, signTypedData_v4, TypedDataUtils } from "eth-sig-util"
import { privateToAddress, ecrecover, fromRpcSig, pubToAddress } from "ethereumjs-util"
import { web3 } from "./script"

export type TypedData = Array<Record<string, any>>;
const DOMAIN_TYPE: TypedData = [
  {
    type: "string",
    name: "name"
  },
  {
    type: "string",
    name: "version"
  },
  {
    type: "uint256",
    name: "chainId"
  },
  {
    type: "address",
    name: "verifyingContract"
  }
];

export type DomainData = {
  name: string;
  version: string;
  chainId: number;
  verifyingContract: string;
};

export function createTypeData(
  domainData: DomainData,
  primaryType: string,
  message: any,
  types: Record<string, TypedData>
) {
  return {
    types: Object.assign(
      {
        EIP712Domain: DOMAIN_TYPE
      },
      types
    ),
    domain: domainData,
    primaryType: primaryType,
    message: message
  };
}

// @ts-ignore
const privateKey: HTMLInputElement = document.getElementById("privateKey")

export async function signTypedData(from: string, data: any) {
  if (privateKey.value) {
    const account = extractAddress(privateKey.value)
    if (from != account) {
      throw new Error("account error")
    }
    return signTypedData_v4(Buffer.from(privateKey.value, "hex"), { data })
  } else {
    const s = fromRpcSig("0x2f204f47e4f1aafe68d593ddd880bfd22f122de370bedf512e5de68a423fc835189353236f35baa2efc1f347aa27af3c4efa7e3dd5df9f89fb77c3c6d67d9e6b1f")
    console.log("s is", s)
    const add = ecrecover(Buffer.from("0x87f31311f5cd187e47d2865e32b4b97cbb33b145430e440adb2c71bc0f0bba6b", "hex"), s.v, s.r, s.s, 3)
    console.log("addr", add.toString("hex"))

    const signer = await getAccount()
    console.log("data is", data)
    const msg = TypedDataUtils.sign(data)
    let hex = `0x${msg.toString("hex")}`
    console.log("msg is", hex)
    const sig = await web3.eth.sign("0x87f31311f5cd187e47d2865e32b4b97cbb33b145430e440adb2c71bc0f0bba6b", signer)
    console.log("sig is", sig)
    const recovered = recoverTypedMessage({ data, sig })
    //0x2f204f47e4f1aafe68d593ddd880bfd22f122de370bedf512e5de68a423fc835189353236f35baa2efc1f347aa27af3c4efa7e3dd5df9f89fb77c3c6d67d9e6b1b
    //0x2f204f47e4f1aafe68d593ddd880bfd22f122de370bedf512e5de68a423fc835189353236f35baa2efc1f347aa27af3c4efa7e3dd5df9f89fb77c3c6d67d9e6b1b
    //0x2f204f47e4f1aafe68d593ddd880bfd22f122de370bedf512e5de68a423fc835189353236f35baa2efc1f347aa27af3c4efa7e3dd5df9f89fb77c3c6d67d9e6b1f
    console.log("recovered", recovered)
    return sig

    /*
    const sig = await web3.eth.sign(msg.toString("binary"), signer)
    console.log("sig is", sig)
    return sig
*/
    /*const msgData = JSON.stringify(data);
    return (await new Promise<any>((resolve, reject) => {
      function cb(err: any, result: any) {
        if (err) return reject(err);
        if (result.error) return reject(result.error);
        const sig = result.result;
        const sig0 = sig.substring(2);
        const r = "0x" + sig0.substring(0, 64);
        const s = "0x" + sig0.substring(64, 128);
        const v = parseInt(sig0.substring(128, 130), 16);
        resolve({ data, sig, v, r, s });
      }

      // @ts-ignore
      return web3.currentProvider.sendAsync({
        method: "eth_signTypedData_v4",
        params: [from, msgData],
        from
      }, cb);
    })).sig*/
  }
}

function extractAddress(privateKey: string) {
  return `0x${privateToAddress(Buffer.from(privateKey, "hex")).toString("hex")}`
}

export async function getAccount(): Promise<string> {
  if (privateKey.value) {
    return extractAddress(privateKey.value)
  } else {
    const [from] = await web3.eth.getAccounts()
    return from
  }
}
