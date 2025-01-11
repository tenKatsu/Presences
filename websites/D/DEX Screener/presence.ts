// functions
interface DexTokenInfo {
	name: string;
	symbol: string;
	price: number;
	chainId: string;
	thumbnail: string;
	chainSymbol: string;
}

const tokenCache: Map<string, DexTokenInfo> = new Map();

async function getTokenInfo(
	tokenAddress: string,
	chainId: string
): Promise<DexTokenInfo | null> {
	const cacheKey = `${chainId}-${tokenAddress}`;
	if (tokenCache.has(cacheKey)) return tokenCache.get(cacheKey) || null;

	const fetchTokenInfo = async () => {
		let response = await fetch(
				`https://api.dexscreener.com/latest/dex/pairs/${chainId}/${tokenAddress}`
			),
			data = await response.json();

		if (!data.pairs || data.pairs.length === 0) {
			response = await fetch(
				`https://api.dexscreener.com/latest/dex/tokens/${tokenAddress}`
			);
			data = await response.json();
		}

		if (data && data.pairs && data.pairs.length > 0) {
			const pair = data.pairs[0],
				getTitlePrice = () => {
					const priceMatch = document.title.match(/\$([0-9.]+)/);
					return priceMatch ? parseFloat(priceMatch[1]) : 0;
				};
			let price = getTitlePrice();
			// price get from title instead of API, for efficiency
			const tokenInfo = {
				name: pair.baseToken.name,
				symbol: pair.baseToken.symbol,
				price,
				chainId: pair.chainId,
				thumbnail: pair.info.imageUrl,
				chainSymbol: pair.quoteToken.symbol,
			};
			tokenCache.set(cacheKey, tokenInfo);

			// Update price periodically based on title changes
			setInterval(() => {
				const newPrice = getTitlePrice();
				if (newPrice !== price) {
					tokenInfo.price = newPrice;
					price = newPrice;
				}
			}, 10000);
			return tokenInfo;
		}
		return null;
	};
	return await fetchTokenInfo();
}

function capitalize(string: string): string {
	return string.charAt(0).toUpperCase() + string.slice(1);
}

const presence = new Presence({
		clientId: "1326168769403289683",
	}),
	browsingTimestamp = Math.floor(Date.now() / 1000);

const enum Assets {
	Logo = "https://i.imgur.com/LWNN5i1.jpeg",
}

const chainLogo = {
	ethereum: "https://i.imgur.com/sRQsRgt.png",
	bsc: "https://i.imgur.com/P3R5xml.png",
	solana: "https://i.imgur.com/yzW1XmK.png",
	base: "https://i.imgur.com/RFCn600.png",
	sui: "https://i.imgur.com/nRLlRS3.png",
	aptos: "https://i.imgur.com/HnRC0zH.png",
	arbitrum: "https://i.imgur.com/62omOHV.png",
	avalanche: "https://i.imgur.com/EnQN7bJ.png",
	cronos: "https://i.imgur.com/X884cZX.png",
	fantom: "https://i.imgur.com/nBuhY97.png",
	hyperliquid: "https://i.imgur.com/4YsBubJ.png",
	ink: "https://i.imgur.com/pqBMg7y.png",
	linea: "https://i.imgur.com/9l7YKgI.png",
	optimism: "https://i.imgur.com/8c49Wtl.png",
	osmosis: "https://i.imgur.com/aPdpP43.png",
	polygon: "https://i.imgur.com/GLDY9Z0.png",
	zksync: "https://i.imgur.com/5bK6sx8.png",
};

presence.on("UpdateData", async () => {
	let details: string | undefined,
		state: string | undefined,
		presenceData: PresenceData,
		tokenInfo: DexTokenInfo | null = null,
		urlToken: string | undefined,
		query;
	const path = document.location.pathname;
	switch (true) {
		case path === "/":
			details = "Home Page";
			state = "Browsing";
			break;
		case path.startsWith("/watchlist"):
			details = "Watchlist";
			break;
		case path.startsWith("/multicharts"):
			details = "Looking at Multi Charts";
			break;
		case path.startsWith("/new-pairs"):
			details = "New Pairs";
			state = "Browsing";
			break;
		case path.startsWith("/gainers"):
			details = "Gainers and Losers";
			state = "Browsing";
			break;
		case path.startsWith("/portfolio"):
			details = "Looking at Portfolio";
			break;
		case path.startsWith("/moonshot"):
			details = "Moonshot";
			state = "Browsing";
			break;
		case path.startsWith("/search"):
			query = new URLSearchParams(document.location.search).get("q") || "-";
			if (query !== "-") {
				details = "Searching for:";
				state = `${query}`;
			} else details = "Searching tokens";
			break;
		default: {
			const pathParts = path.split("/");
			if (pathParts.length === 2) {
				details = `Browsing ${capitalize(pathParts[1])} tokens`;
				const smallImageKey =
					new Map(Object.entries(chainLogo)).get(pathParts[1]) ||
					`https://dd.dexscreener.com/ds-data/chains/${pathParts[1]}.png`;
				presenceData = {
					details,
					largeImageKey: Assets.Logo,
					smallImageKey,
					startTimestamp: browsingTimestamp,
				};
				presence.setActivity(presenceData);
				return;
			} else if (pathParts.length >= 3) {
				const chainId = pathParts[1],
					tokenAddress = pathParts[2];
				tokenInfo = await getTokenInfo(
					decodeURIComponent(tokenAddress),
					chainId
				);

				if (tokenInfo) {
					urlToken = `https://dexscreener.com/${chainId}/${tokenAddress}`;
					details = `(${tokenInfo.symbol}/${tokenInfo.chainSymbol}) ${tokenInfo.name}`;
					state = `$${tokenInfo.price}`;
					presenceData = {
						details,
						state,
						largeImageKey: tokenInfo.thumbnail,
						smallImageKey: Assets.Logo,
						startTimestamp: browsingTimestamp,
						buttons: [
							{
								label: "View Token",
								url: urlToken,
							},
						],
					};
					presence.setActivity(presenceData);
					return;
				}
			}
		}
	}

	if (details) {
		presenceData = {
			details,
			state,
			largeImageKey: Assets.Logo,
			startTimestamp: browsingTimestamp,
		};
		presence.setActivity(presenceData);
	}
});
