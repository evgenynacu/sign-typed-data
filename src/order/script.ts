import { EIP712Domain, EIP712SignMessage, EncodedOrder, OrderForm } from "./domain"
import { createTypeData, getAccount, signTypedData } from "../sign"
import { client, web3 } from "../script"

async function signOrderMessage(
	struct: any,
	types: any,
	structType: string,
	domain: EIP712Domain,
	account: string
) {
	const data = createTypeData(
		domain,
		structType,
		struct,
		types,
	)
	console.log("signing", data)
	return signTypedData(account, data)
}

async function prepareOrderMessage(form: Omit<OrderForm, "signature">): Promise<EncodedOrder> {
	const res = await client.post<EncodedOrder>("/protocol/v0.1/ethereum/order/encoder/order", form)
	return res.data
}

function createOrder(
	maker: string, contract: string, tokenId: string, price: string,
): Omit<OrderForm, "signature"> {
	return {
		type: "RARIBLE_V2",
		maker: maker,
		make: {
			"assetType": {
				"assetClass": "ERC721",
				"contract": contract,
				"tokenId": tokenId,
			},
			"value": "1",
		},
		take: {
			"assetType": {
				"assetClass": "ETH",
			},
			"value": price,
		},
		data: {
			"dataType": "RARIBLE_V2_DATA_V1",
			"payouts": [],
			"originFees": [],
		},
		salt: `${random(1, 10000)}`,
	}
}

const random = (min: number, max: number) => Math.floor(Math.random() * (max - min)) + min

async function putOrder(order: OrderForm) {
	const res = await client.post("/protocol/v0.1/ethereum/order/orders", order)
	return res.data
}

async function signOrderForm(form: Omit<OrderForm, "signature">): Promise<OrderForm> {
	const encoded = await prepareOrderMessage(form)
	const msg = encoded.signMessage as EIP712SignMessage
	const signature = await signOrderMessage(
		msg.struct, msg.types, msg.structType, msg.domain, form.maker
	)
	return { ...form, signature }
}

export async function createAndSignOrder(contract: string, tokenId: string, price: string) {
	const maker = await getAccount()
	return signAndPut(createOrder(maker, contract, tokenId, price))
}

async function signAndPut(notSignedOrderForm: Omit<OrderForm, "signature">) {
	const signed = await signOrderForm(notSignedOrderForm)
	return putOrder(signed)
}

export async function matchOrder(hash: string, amount: number): Promise<any> {
	const maker = await getAccount()
	const preparedTx = await prepareTx(hash, maker, amount)
	const tx = {
		from: maker,
		data: preparedTx.transaction.data,
		to: preparedTx.transaction.to,
		value: preparedTx.asset.value
	}
	console.log("sending tx", tx);
	return web3.eth.sendTransaction(tx)
}

async function prepareTx(hash: string, maker: string, amount: number): Promise<any> {
	const res = await client.post<any>(`/protocol/v0.1/ethereum/order/orders/${hash}/prepareTx`, { maker, amount, payouts: [], originFees: [] })
	return res.data
}
