import { createTypeData, getAccount, signTypedData } from "../sign"
import { ERC1155Types, ERC1155LazyMint, ERC721Types, LazyMint } from "./domain"
import { client } from "../script"

async function generateTokenId(type: "ERC721" | "ERC1155", minter: string): Promise<string> {
	console.log("generating tokenId for", getAddress(type), minter)
	const res = await client.get(`/protocol/v0.1/ethereum/nft/collections/${getAddress(type)}/generate_token_id?minter=${minter}`)
	return res.data.tokenId
}

async function putLazyMint(form: LazyMint) {
	const res = await client.post("/protocol/v0.1/ethereum/nft/mints", form)
	return res.data
}

export async function signAndPutLazyMint(form: Omit<LazyMint, "signatures">): Promise<any> {
	const signed = await signLazyMint(form)
	return putLazyMint(signed)
}

async function signLazyMint(form: Omit<LazyMint, "signatures">): Promise<LazyMint> {
	const signature = await signLazyMintMessage(
		form,
		form.creators[0].account,
		1,
		getAddress(form["@type"])
	);
	return { ...form, signatures: [signature] } as any
}

function getAddress(type: "ERC721" | "ERC1155"): string {
	return type === "ERC721" ? "0xf6793da657495ffeff9ee6350824910abc21356c" : "0xb66a603f4cfe17e3d27b87a8bfcad319856518b8"
}

async function signLazyMintMessage(
	form: Omit<LazyMint, "signatures">,
	account: string,
	chainId: number,
	verifyingContract: string
) {
	const typeName = form["@type"] === "ERC721" ? "Mint721" : "Mint1155"
	const data = createTypeData(
		{
			name: typeName,
			version: "1",
			chainId,
			verifyingContract
		},
		typeName,
		{ ...form, tokenURI: form.uri },
		form["@type"] === "ERC721" ? ERC721Types : ERC1155Types
	);
	console.log("signing", data)
	return signTypedData(account, data);
}

export async function createTestLazyMint(): Promise<Omit<ERC1155LazyMint, "signatures">> {
	const creator = await getAccount()
	console.log("creator is", creator)
	const tokenId = await generateTokenId("ERC1155", creator)
	console.log("generated tokenId", tokenId)
	const s: Omit<ERC1155LazyMint, "signatures"> =  {
		"@type": "ERC1155",
		contract: getAddress("ERC1155"),
		tokenId: tokenId,
		uri: "/ipfs/QmWLsBu6nS4ovaHbGAXprD1qEssJu4r5taQfB74sCG51tp",
		creators: [{ account: creator, value: "10000" }],
		royalties: [],
		supply: "3"
	} 
	return s
}

export async function testSignAndCreateLazyMint(): Promise<any> {
	const form = await createTestLazyMint()
	return await signAndPutLazyMint(form)
}
