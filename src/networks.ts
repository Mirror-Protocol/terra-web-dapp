import { NetworkInfo } from "@terra-money/wallet-provider"

type MirrorNetworkInfo = NetworkInfo & LocalNetworkConfig

const networks: Record<string, MirrorNetworkInfo> = {
  classic: {
    name: "classic",
    chainID: "columbus-5",
    lcd: "https://columbus-lcd.terra.dev",
    contract: "https://whitelist.mirror.finance/columbus.json",
    mantle: "https://columbus-mantle.terra.dev/",
    shuttle: {
      ethereum: "terra13yxhrk08qvdf5zdc9ss5mwsg5sf7zva9xrgwgc",
      bsc: "terra1g6llg3zed35nd3mh9zx6n64tfw3z67w2c48tn2",
    },
    astro: {
      token: "terra1xj49zyqrwpv5k928jwfpfy2ha668nwdgkwlrg3",
      generator: "terra1zgrx9jjqrfye8swykfgmd6hpde60j0nszzupp9",
    },
    mirrorTerraswap: {
      pair: "terra1amv303y8kzxuegvurh0gug2xe9wkgj65enq2ux",
      lpToken: "terra17gjf2zehfvnyjtdgua9p9ygquk6gukxe7ucgwh",
    },
    fee: { gasPrice: 0.15, amount: 100000 }, // 0.1 UST
  },
  testnet: {
    name: "testnet",
    chainID: "bombay-12",
    lcd: "https://bombay-lcd.terra.dev",
    contract: "https://whitelist.mirror.finance/bombay.json",
    mantle: "https://bombay-mantle.terra.dev/",
    shuttle: {
      ethereum: "terra10a29fyas9768pw8mewdrar3kzr07jz8f3n73t3",
      bsc: "terra1paav7jul3dzwzv78j0k59glmevttnkfgmgzv2r",
    },
    astro: {
      token: "terra1jqcw39c42mf7ngq4drgggakk3ymljgd3r5c3r5",
      generator: "terra1gjm7d9nmewn27qzrvqyhda8zsfl40aya7tvaw5",
    },
    mirrorTerraswap: {
      pair: "terra1cz6qp8lfwht83fh9xm9n94kj04qc35ulga5dl0",
      lpToken: "terra1zrryfhlrpg49quz37u90ck6f396l4xdjs5s08j",
    },
    fee: { gasPrice: 0.15, amount: 150000 }, // 0.15 UST
  },
  moonshine: {
    name: "moonshine",
    chainID: "localterra",
    lcd: "https://moonshine-lcd.terra.dev",
    contract: "https://whitelist.mirror.finance/moonshine.json",
    mantle: "https://moonshine-mantle.terra.dev",
    shuttle: {
      ethereum: "",
      bsc: "",
    },
    astro: {
      token: "",
      generator: "",
    },
    mirrorTerraswap: {
      pair: "terra1amv303y8kzxuegvurh0gug2xe9wkgj65enq2ux",
      lpToken: "terra17gjf2zehfvnyjtdgua9p9ygquk6gukxe7ucgwh",
    },
    fee: { gasPrice: 0.15, amount: 150000 }, // 0.15 UST
  },
}

export const defaultNetwork = networks.classic

export default networks
