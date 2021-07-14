import Web3 from "web3"
import 'regenerator-runtime/runtime'
import axios from "axios"
import { testSignAndCreateLazyMint } from "./lazy-mint/script"
import { createAndSignOrder, matchOrder } from "./order/script"
import { getAccount } from "./sign"

const provider = (window as any).ethereum
export const web3 = new Web3(provider)

export const client = axios.create({
	baseURL: "https://api-dev.rarible.com",
})

// @ts-ignore
const contractInput: HTMLInputElement = document.getElementById("contract")
// @ts-ignore
const tokenIdInput: HTMLInputElement = document.getElementById("tokenId")
// @ts-ignore
const priceInput: HTMLInputElement = document.getElementById("price")
// @ts-ignore
const hashInput: HTMLInputElement = document.getElementById("hash")
// @ts-ignore
const amountInput: HTMLInputElement = document.getElementById("amount")


document.getElementById("connect")?.addEventListener("click", (e) => {
	e.preventDefault()
	provider.enable()
})

document.getElementById("createLazyMint")?.addEventListener("click", (e) => {
	e.preventDefault()
	testSignAndCreateLazyMint()
		.then(x => {
			console.log("SENT", x)
			// @ts-ignore
			contractInput.value = x.contract
			// @ts-ignore
			tokenIdInput.value = x.tokenId
		})
		.catch(err => console.error("ERROR", err))
})

document.getElementById("createOrder")?.addEventListener("click", (e) => {
	e.preventDefault()
	createAndSignOrder(contractInput.value, tokenIdInput.value, priceInput.value)
		.then(x => {
			hashInput.value = x.hash
			console.log("SENT", x)
		})
		.catch(err => console.error("ERROR", err))
})

document.getElementById("matchOrder")?.addEventListener("click", (e) => {
	e.preventDefault()
	matchOrder(hashInput.value, parseInt(amountInput.value))
		.then(x => console.log("SENT", x))
		.catch(err => console.error("ERROR", err))
})

document.getElementById("test")?.addEventListener("click", e => {
	e.preventDefault()
	testSign().then(console.log)
})

async function testSign() {
	const signer = await getAccount()
	console.log("signer is", signer)
	return await web3.eth.sign("0x12345678901234567890123456789012", signer)
	//
	// return await (web3.eth.personal as any).sign("11Ằ☭:fox_face::mouse:ößt 桜どラ ❉", signer)
}
