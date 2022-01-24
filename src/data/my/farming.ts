import { gt, plus, sum, times } from "../../libs/math"
import { PriceKey, StakingKey } from "../../hooks/contractKeys"
import { useProtocol } from "../contract/protocol"
import { useFindPrice, useFindStaking } from "../contract/normalize"
import { useRewards } from "./rewards"
import { useAssetsAPR } from "../apr/apr"
import usePool from "../../forms/modules/usePool"
import useMirrorTerraswapPool from "../../forms/modules/useMirrorTerraswapPool"
import { useAstroLpStakedBalance } from "../external/astroport"
import { useAstroPendingRewards } from "../external/astroport"

export const useMyFarming = () => {
  const priceKey = PriceKey.PAIR
  const { whitelist, listedAll, getToken, getIsDelisted } = useProtocol()
  const { contents: findStaking, isLoading } = useFindStaking()
  const findPrice = useFindPrice()
  const { contents: rewards, isLoading: isLoadingRewards } = useRewards()
  const getPool = usePool()
  const getMirrorTerraswapPool = useMirrorTerraswapPool()
  const assetsAPR = useAssetsAPR()
  const { data: astroPendingRewards } = useAstroPendingRewards()
  const { data: astroLpStakedBalance = "0" } = useAstroLpStakedBalance()
  const astroTokenRewardAmount = astroPendingRewards?.pending ?? "0"

  /* Astro */
  const mirrorToken = getToken("MIR")
  const mirrorItem = whitelist[mirrorToken]
  const mirrorPool = getPool({
    amount: astroLpStakedBalance,
    token: mirrorToken,
  })

  const mirrorData = {
    ...mirrorItem,
    migrationRequired: false,
    delisted: false,
    apr: assetsAPR[mirrorToken]?.long,
    staked: astroLpStakedBalance,
    rewards: astroPendingRewards?.pending_on_proxy ?? "0",
    astroTokenReward: astroTokenRewardAmount,
    withdrawable: mirrorPool.fromLP,
  }

  const dataSourceListed = listedAll
    .map((item: ListedItem) => {
      /* Terraswap */
      const { token } = item
      const balance = findStaking(StakingKey.LPSTAKED, token)
      const pool = getPool({ amount: balance, token })
      const mirrorTerraswapPool = getMirrorTerraswapPool?.(balance)
      const migrationRequired = token === mirrorToken

      return {
        ...item,
        migrationRequired,
        delisted: getIsDelisted(token),
        apr: assetsAPR[token]?.long,
        staked: findStaking(StakingKey.LPSTAKED, token),
        rewards: findStaking(StakingKey.LPREWARD, token),
        astroTokenReward: "0",
        withdrawable: migrationRequired
          ? mirrorTerraswapPool?.fromLP
          : pool.fromLP,
      }
    })
    .filter(({ staked, rewards }) => {
      const isStaked = staked && gt(staked, 0)
      const hasRewards = gt(rewards, 0)
      return isStaked || hasRewards
    })

  const dataSource = gt(astroLpStakedBalance ?? 0, 0)
    ? [mirrorData, ...dataSourceListed]
    : dataSourceListed

  const price = findPrice(priceKey, mirrorToken)
  const totalRewards = plus(rewards.long, astroPendingRewards?.pending_on_proxy)
  const totalAstroTokenReward = astroTokenRewardAmount

  const totalRewardsValue = times(rewards.long, price)
  const totalWithdrawableValue = sum(
    dataSource.map(({ withdrawable }) => withdrawable?.value ?? 0)
  )

  return {
    dataSource,
    totalRewards,
    totalAstroTokenReward,
    totalRewardsValue,
    totalWithdrawableValue,
    isLoading: isLoading || isLoadingRewards,
  }
}
