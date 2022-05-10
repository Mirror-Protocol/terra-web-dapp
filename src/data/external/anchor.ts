import { selector } from "recoil"
import { useQuery } from "react-query"
import { useLCDClient } from "@terra-money/wallet-provider"
import { gql, request } from "graphql-request"
import { useMantleURL, useNetwork } from "../network"
import { mantleURLQuery, networkNameState } from "../network"
import { getContractQueryQuery } from "../utils/query"
import {
  getPairPricesQuery,
  getTokenBalancesQuery,
  useGetPairPrices,
  useGetTokenBalances,
} from "./terraswap"

interface Protocol {
  contracts: Dictionary<string>
  assets: Dictionary<ListedItemExternal>
}

const mainnet: Protocol = {
  contracts: {
    anchorMarket: "terra1sepfj7s0aeg5967uxnfk4thzlerrsktkpelm5s",
  },
  assets: {
    terra1hzh9vpxhsk8253se0vv5jj6etdvxu3nv8z07zu: {
      symbol: "aUST",
      token: "terra1hzh9vpxhsk8253se0vv5jj6etdvxu3nv8z07zu",
      icon: "https://whitelist.anchorprotocol.com/logo/aUST.png",
      status: "LISTED",
    },
    terra14z56l0fp2lsf86zy3hty2z47ezkhnthtr9yq76: {
      symbol: "ANC",
      token: "terra14z56l0fp2lsf86zy3hty2z47ezkhnthtr9yq76",
      pair: "terra1gm5p3ner9x9xpwugn9sp6gvhd0lwrtkyrecdn3",
      icon: "https://whitelist.anchorprotocol.com/logo/ANC.png",
      status: "DELISTED",
    },
  },
}

const testnet: Protocol = {
  contracts: {
    anchorMarket: "terra15dwd5mj8v59wpj0wvt233mf5efdff808c5tkal",
  },
  assets: {
    terra1ajt556dpzvjwl0kl5tzku3fc3p3knkg9mkv8jl: {
      symbol: "aUST",
      token: "terra1ajt556dpzvjwl0kl5tzku3fc3p3knkg9mkv8jl",
      icon: "https://whitelist.anchorprotocol.com/logo/aUST.png",
      status: "LISTED",
    },
    terra1747mad58h0w4y589y3sk84r5efqdev9q4r02pc: {
      symbol: "ANC",
      token: "terra1747mad58h0w4y589y3sk84r5efqdev9q4r02pc",
      pair: "terra1wfvczps2865j0awnurk9m04u7wdmd6qv3fdnvz",
      icon: "https://whitelist.anchorprotocol.com/logo/ANC.png",
      status: "DELISTED",
    },
  },
}

const bombay: Protocol = {
  contracts: {
    anchorMarket: "terra15dwd5mj8v59wpj0wvt233mf5efdff808c5tkal",
  },
  assets: {
    terra1ajt556dpzvjwl0kl5tzku3fc3p3knkg9mkv8jl: {
      symbol: "aUST",
      token: "terra1ajt556dpzvjwl0kl5tzku3fc3p3knkg9mkv8jl",
      icon: "https://whitelist.anchorprotocol.com/logo/aUST.png",
      status: "LISTED",
    },
    terra1747mad58h0w4y589y3sk84r5efqdev9q4r02pc: {
      symbol: "ANC",
      token: "terra1747mad58h0w4y589y3sk84r5efqdev9q4r02pc",
      pair: "terra1wfvczps2865j0awnurk9m04u7wdmd6qv3fdnvz",
      icon: "https://whitelist.anchorprotocol.com/logo/ANC.png",
      status: "LISTED",
    },
  },
}

const placeholder: Protocol = {
  contracts: { anchorMarket: "" },
  assets: {},
}

export const useAnchorProtocol = () => {
  const { name } = useNetwork()
  const protocol = { mainnet, testnet, bombay }[name] ?? placeholder

  const getToken = (symbol: string) =>
    Object.values(protocol?.assets ?? {}).find((item) => item.symbol === symbol)
      ?.token ?? ""

  return { ...protocol, getToken }
}

const useLastSyncedHeight = () => {
  const url = useMantleURL()
  return useQuery(
    ["lastSyncedHeight", url],
    async () =>
      await request<{ LastSyncedHeight: number }>(
        url + "?height",
        LAST_SYNCED_HEIGHT
      )
  )
}

export const useAnchorMarketEpochState = () => {
  const lcd = useLCDClient()
  const { contracts } = useAnchorProtocol()
  const { data: height } = useLastSyncedHeight()

  return useQuery(
    ["anchorMarketEpochState", contracts, height?.LastSyncedHeight, lcd.config],
    async () =>
      await lcd.wasm.contractQuery<EpochState>(contracts["anchorMarket"], {
        epoch_state: { block_height: height?.LastSyncedHeight ?? 0 + 1 },
      }),
    { enabled: !!contracts["anchorMarket"] && !!height }
  )
}

export const useAnchorPrices = () => {
  const { name } = useNetwork()
  const { assets, getToken } = useAnchorProtocol()
  const { data: epochState } = useAnchorMarketEpochState()
  const getPairPrices = useGetPairPrices("anchorPairPrices")
  const { data: pairPrices } = useQuery(
    ["anchorPairPrices", assets, name],
    async () => await getPairPrices(assets)
  )

  return {
    ...pairPrices,
    [getToken("aUST")]: epochState?.exchange_rate ?? "0",
  }
}

export const useAnchorBalances = () => {
  const { assets } = useAnchorProtocol()
  const { name } = useNetwork()
  const getTokenBalance = useGetTokenBalances("anchorTokenBalances")
  return useQuery(
    ["anchorTokenBalances", assets, name],
    async () => await getTokenBalance(assets)
  )
}

export const useAnchorAssetList = () => {
  const { assets } = useAnchorProtocol()
  const anchorPrices = useAnchorPrices()
  const { data: anchorBalances } = useAnchorBalances()
  return Object.keys(assets).map((token) => ({
    ...assets[token],
    price: anchorPrices[token],
    balance: anchorBalances?.[token],
  }))
}

export const anchorProtocolQuery = selector({
  key: "anchorProtocol",
  get: ({ get }) => {
    const networkName = get(networkNameState)
    const protocol = { mainnet, testnet, bombay }[networkName] ?? placeholder

    const getToken = (symbol: string) =>
      Object.values(protocol?.assets ?? {}).find(
        (item) => item.symbol === symbol
      )?.token ?? ""

    return { ...protocol, getToken }
  },
})

interface EpochState {
  aterra_supply: string
  exchange_rate: string
}

const LAST_SYNCED_HEIGHT = gql`
  query {
    LastSyncedHeight
  }
`

const lastSyncedHeightQuery = selector({
  key: "lastSyncedHeight",
  get: async ({ get }) => {
    const url = get(mantleURLQuery)
    const { LastSyncedHeight } = await request<{ LastSyncedHeight: number }>(
      url + "?height",
      LAST_SYNCED_HEIGHT
    )

    return LastSyncedHeight
  },
})

export const anchorMarketEpochStateQuery = selector({
  key: "anchorMarketEpochState",
  get: async ({ get }) => {
    const getContractQuery = get(getContractQueryQuery)
    const height = get(lastSyncedHeightQuery)
    const { contracts } = get(anchorProtocolQuery)

    return await getContractQuery<EpochState>(
      {
        contract: contracts["anchorMarket"],
        msg: { epoch_state: { block_height: height + 1 } },
      },
      "anchorMarketEpochState"
    )
  },
})

export const anchorPricesQuery = selector<Dictionary>({
  key: "anchorPrices",
  get: async ({ get }) => {
    const { assets, getToken } = get(anchorProtocolQuery)
    const getPairPrices = get(getPairPricesQuery("anchorPairPrices"))
    const pairPrices = await getPairPrices(assets)
    const epochState = get(anchorMarketEpochStateQuery)

    return {
      ...pairPrices,
      [getToken("aUST")]: epochState?.exchange_rate ?? "0",
    }
  },
})

export const anchorBalancesQuery = selector({
  key: "anchorBalances",
  get: async ({ get }) => {
    const { assets } = get(anchorProtocolQuery)
    const getTokenBalances = get(getTokenBalancesQuery("anchorTokenBalances"))
    return await getTokenBalances(assets)
  },
})

export const anchorAssetListQuery = selector({
  key: "anchorAssets",
  get: ({ get }) => {
    const { assets } = get(anchorProtocolQuery)
    const anchorPrices = get(anchorPricesQuery)
    const anchorBalances = get(anchorBalancesQuery)

    return Object.keys(assets).map((token) => ({
      ...assets[token],
      price: anchorPrices[token],
      balance: anchorBalances[token],
    }))
  },
})
