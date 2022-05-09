import { useQuery } from "react-query"
import BigNumber from "bignumber.js"
import { useGetListedContractQueries } from "../utils/queries"
import { useMIRPrice, usePairPrices } from "../contract/normalize"
import { parsePairPool } from "../contract/normalize"
import { useProtocol, useProtocolAddress } from "../contract/protocol"
import { usePairPool } from "../contract/contract"
import { useFactoryDistributionInfo } from "../contract/info"

const num = (number: BigNumber.Value) => new BigNumber(number)

interface StakingPool {
  total_bond_amount: string
  short_reward_weight: string
  total_short_amount: string
}

const useStakingPoolInfo = () => {
  const { data: protocolAddress } = useProtocolAddress()
  const contracts = protocolAddress?.contracts ?? {}
  const getListedContractQueries = useGetListedContractQueries()

  return useQuery(
    ["stakingPoolInfo", contracts],
    async () =>
      await getListedContractQueries<StakingPool>(
        ({ token }) => ({
          token,
          contract: contracts["staking"],
          msg: { pool_info: { asset_token: token } },
        }),
        "stakingPoolInfo"
      )
  )
}

const useAnnualRewards = () => {
  // genesis(2020-12-04 04:00 KST) + 6hours
  const START = 1607022000000 + 60000 * 60 * 6
  const YEAR = 60000 * 60 * 24 * 365

  const distributionSchedules = [
    [START, YEAR * 1 + START, "54900000000000"],
    [YEAR * 1 + START, YEAR * 2 + START, "27450000000000"],
    [YEAR * 2 + START, YEAR * 3 + START, "13725000000000"],
    [YEAR * 3 + START, YEAR * 4 + START, "6862500000000"],
  ]

  const now = Date.now()
  const schedule = distributionSchedules.find(
    (schedule) => now >= schedule[0] && now <= schedule[1]
  )

  const reward = Array.isArray(schedule) ? schedule[2] : "0"

  const { data: weights } = useFactoryDistributionInfo()

  if (reward === "0" || !weights) {
    return {}
  }

  const totalWeight = weights.reduce((acc, cur) => acc.plus(cur[1]), num(0))

  const getTokenReward = (weight: number) =>
    num(reward).multipliedBy(num(weight).dividedBy(totalWeight))

  return weights
    .filter(([, weight]) => num(weight).isGreaterThan(0))
    .reduce<Dictionary>(
      (acc, cur) =>
        Object.assign(acc, {
          [cur[0]]: getTokenReward(cur[1]).toFixed(0),
        }),
      {}
    )
}

export const useAssetsAPR = () => {
  const { listed } = useProtocol()
  const mirPrice = useMIRPrice()
  const pairPrices = usePairPrices()
  const annualRewards = useAnnualRewards()
  const { data: pairPoolAssets } = usePairPool()
  const { data: stakingPoolInfoAssets } = useStakingPoolInfo()

  const getAPR = (token: string) => {
    const annualReward = annualRewards[token]
    const stakingPoolInfo = stakingPoolInfoAssets![token]
    const pairPool = parsePairPool(pairPoolAssets![token])
    const price = pairPrices[token]

    if (annualReward === "0" || mirPrice === "0") {
      return { long: "0", short: "0" }
    }

    const { short_reward_weight, total_bond_amount, total_short_amount } =
      stakingPoolInfo
    const { asset: pool, uusd: uusdPool, total: lpShares } = pairPool

    const stakedLiquidityValue = num(uusdPool)
      .dividedBy(pool)
      .multipliedBy(pool)
      .plus(uusdPool)
      .multipliedBy(num(total_bond_amount).dividedBy(lpShares))

    const longReward = num(annualReward).multipliedBy(
      num(1).minus(short_reward_weight || 0)
    )

    const shortValue = num(
      [total_short_amount, price].every((n) => num(n).isGreaterThan(0))
        ? num(total_short_amount).multipliedBy(price).toFixed(0)
        : "0"
    )

    const shortReward = num(annualReward).multipliedBy(short_reward_weight)

    return {
      long: stakedLiquidityValue.isGreaterThan(0)
        ? longReward
            .multipliedBy(mirPrice)
            .dividedBy(stakedLiquidityValue)
            .toFixed(4)
        : "0",
      short: shortValue.isGreaterThan(0)
        ? shortReward.multipliedBy(mirPrice).dividedBy(shortValue).toFixed(4)
        : "0",
    }
  }

  return listed.reduce<Dictionary<{ long: string; short: string }>>(
    (acc, { token }) => {
      try {
        return { ...acc, [token]: getAPR(token) }
      } catch {
        return {}
      }
    },
    {}
  )
}
