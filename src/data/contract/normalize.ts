import { useQuery } from "react-query"
import { selector } from "recoil"
import { fromPairs } from "ramda"
import { useLCDClient } from "@terra-money/wallet-provider"
import { Coins } from "@terra-money/terra.js"
import { div, gt, times } from "../../libs/math"
import { useAddress } from "../../hooks"
import { PriceKey, BalanceKey, StakingKey } from "../../hooks/contractKeys"
import { useExchangeRates } from "../native/exchange"
import { useExternalBalances } from "../external/external"
import { useExternalPrices } from "../external/external"
import { useProtocol } from "./protocol"
import {
  usePairPool,
  useStakingRewardInfo,
  useGovStaker,
  useLpTokenBalance,
  useOraclePrice,
  useMintAssetConfig,
  useTokenBalance,
  tokenBalanceQuery,
} from "./contract"
import { useCollateralOracleAssetInfo } from "./collateral"

/* price */
export const useNativePrices = () => {
  const { data } = useExchangeRates()
  const exchangeRates = data?.toData() ?? []
  return reduceNativePrice(exchangeRates)
}

export const usePairPrices = () => {
  const { data: pairPool } = usePairPool()
  return dict(pairPool, calcPairPrice)
}

export const useOraclePrices = () => {
  const { data: oraclePrices } = useOraclePrice()
  return dict(oraclePrices, ({ rate }) => rate)
}

export const usePrePrices = () => {
  const { data: config } = useMintAssetConfig()
  return dict(config, ({ ipo_params }) => ipo_params?.pre_ipo_price ?? "0")
}

export const useEndPrices = () => {
  const { data: config } = useMintAssetConfig()
  return dict(config, ({ end_price }) => end_price)
}

export const useTokenBalances = () => {
  const { data: result } = useTokenBalance()
  return result ? dict(result, ({ balance }) => balance) : {}
}

export const tokenBalancesQuery = selector({
  key: "tokenBalances",
  get: ({ get }) => {
    const result = get(tokenBalanceQuery)
    return result ? dict(result, ({ balance }) => balance) : {}
  },
})

export const useLpStakableBalances = () => {
  const { data: result } = useLpTokenBalance()
  return result ? dict(result, ({ balance }) => balance) : {}
}

export const useLpStakedBalances = () => {
  const { data: result } = useStakingRewardInfo()
  return result ? reduceStakingReward(result, "bond_amount") : {}
}

export const useSlpStakedBalances = () => {
  const { data: result } = useStakingRewardInfo()
  return result ? reduceStakingReward(result, "bond_amount", true) : {}
}

export const useLpRewardBalances = () => {
  const { data: result } = useStakingRewardInfo()
  return result ? reduceStakingReward(result, "pending_reward") : {}
}

export const useSlpRewardBalances = () => {
  const { data: result } = useStakingRewardInfo()
  return result ? reduceStakingReward(result, "pending_reward", true) : {}
}

export const useGovStaked = () => {
  const { data: govStaker } = useGovStaker()
  return govStaker?.balance ?? "0"
}

/* protocol - asset info */
export const useMinCollateralRatio = () => {
  const { data } = useMintAssetConfig()
  return dict(data, ({ min_collateral_ratio }) => min_collateral_ratio)
}

export const useMultipliers = (): Dictionary => {
  const { data } = useCollateralOracleAssetInfo()
  return { uusd: "1", ...dict(data, ({ multiplier }) => multiplier) }
}

export const useMIRPrice = () => {
  const { getToken } = useProtocol()
  const pairPrices = usePairPrices()
  return pairPrices[getToken("MIR")]
}

/* store: balance */
export const useNativeBalances = () => {
  const lcd = useLCDClient()
  const address = useAddress()

  const { data } = useQuery("nativebalance", async () => {
    const [balance] = await lcd.bank.balance(address)
    return fromPairs(
      balance.toArray().map(({ amount, denom }) => [denom, amount.toString()])
    )
  })

  return data ?? {}
}

/* hooks:find */
export const useFindPrice = () => {
  const { getPriceKey } = useProtocol()

  const pairPrices = usePairPrices()
  const oraclePrices = useOraclePrices()
  const nativePrices = useNativePrices()
  const prePrices = usePrePrices()
  const endPrices = useEndPrices()
  const externalPrices = useExternalPrices()

  const dictionary = {
    [PriceKey.PAIR]: pairPrices,
    [PriceKey.ORACLE]: oraclePrices,
    [PriceKey.NATIVE]: nativePrices,
    [PriceKey.PRE]: prePrices,
    [PriceKey.END]: endPrices,
    [PriceKey.EXTERNAL]: externalPrices,
  }

  return (key: PriceKey, token: string) =>
    dictionary[getPriceKey(key, token)][token]
}

export const useFindBalance = () => {
  const { getBalanceKey } = useProtocol()

  const nativeBalances = useNativeBalances()
  const tokenBalances = useTokenBalances()
  const externalBalances = useExternalBalances()

  const dictionary = {
    [BalanceKey.NATIVE]: nativeBalances,
    [BalanceKey.TOKEN]: tokenBalances,
    [BalanceKey.EXTERNAL]: externalBalances.contents,
  }

  return {
    contents: (token: string) => dictionary[getBalanceKey(token)][token],
    isLoading: [nativeBalances, tokenBalances, externalBalances].some(
      ({ isLoading }) => isLoading
    ),
  }
}

export const useFindStaking = () => {
  const lpStakableBalances = useLpStakableBalances()
  const lpStakedBalances = useLpStakedBalances()
  const slpStakedBalances = useSlpStakedBalances()
  const lpRewardBalances = useLpRewardBalances()
  const slpRewardBalances = useSlpRewardBalances()

  const dictionary = {
    [StakingKey.LPSTAKABLE]: lpStakableBalances,
    [StakingKey.LPSTAKED]: lpStakedBalances,
    [StakingKey.SLPSTAKED]: slpStakedBalances,
    [StakingKey.LPREWARD]: lpRewardBalances,
    [StakingKey.SLPREWARD]: slpRewardBalances,
  }

  return {
    contents: (key: StakingKey, token: string) => dictionary[key][token],
    isLoading: [
      lpStakableBalances,
      lpStakedBalances,
      slpStakedBalances,
      lpRewardBalances,
      slpRewardBalances,
    ].some(({ isLoading }) => isLoading),
  }
}

export const useLiquidity = () => {
  const { data: pairPool } = usePairPool()
  return dict(pairPool, (item) => times(parsePairPool(item).uusd, 2))
}

/* utils */
export const dict = <Data, Item = string>(
  dictionary: Dictionary<Data> = {},
  selector: (data: Data, token?: string) => Item
) =>
  Object.entries(dictionary).reduce<Dictionary<Item>>(
    (acc, [token, data]) =>
      selector(data, token) ? { ...acc, [token]: selector(data, token) } : acc,
    {}
  )

/* helpers */
export const parsePairPool = (pool?: PairPool) => {
  if (!pool) return { uusd: "0", asset: "0", total: "0" }

  const { assets, total_share } = pool
  return {
    uusd: assets.find(({ info }) => "native_token" in info)?.amount ?? "0",
    asset: assets.find(({ info }) => "token" in info)?.amount ?? "0",
    total: total_share ?? "0",
  }
}

export const calcPairPrice = (param: PairPool) => {
  const { uusd, asset } = parsePairPool(param)
  return [uusd, asset].every((v) => v && gt(v, 0)) ? div(uusd, asset) : "0"
}

const reduceStakingReward = (
  { reward_infos }: StakingRewardInfo,
  key: "bond_amount" | "pending_reward",
  short = false
) =>
  reward_infos.reduce<Dictionary>(
    (acc, { asset_token, is_short, ...rest }) =>
      Object.assign(
        {},
        acc,
        is_short === short && { [asset_token]: rest[key] }
      ),
    {}
  )

const reduceNativePrice = (coins: Coins.Data): Dictionary => ({
  uusd: "1",
  uluna: coins.find(({ denom }) => denom === "uusd")?.amount ?? "0",
})
