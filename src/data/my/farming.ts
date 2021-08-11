import { gt, sum, times } from "../../libs/math"
import { PriceKey, StakingKey } from "../../hooks/contractKeys"
import { useProtocol } from "../contract/protocol"
import { useFindPrice, useFindStaking } from "../contract/normalize"
import { useRewards } from "./rewards"
import { useAssetsAPR } from "../apr/apr"
import usePool from "../../forms/modules/usePool"

export const useMyFarming = () => {
  const priceKey = PriceKey.PAIR
  const { listedAll, getToken, getIsDelisted } = useProtocol()
  const { contents: findStaking, isLoading } = useFindStaking()
  const findPrice = useFindPrice()
  const { contents: rewards, isLoading: isLoadingRewards } = useRewards()
  const getPool = usePool()
  const assetsAPR = useAssetsAPR()

  const mir = getToken("MIR")

  const dataSource = listedAll
    .map((item: ListedItem) => {
      const { token } = item
      const balance = findStaking(StakingKey.LPSTAKED, token)
      const { fromLP } = getPool({ amount: balance, token })

      return {
        ...item,
        delisted: getIsDelisted(token),
        apr: assetsAPR[token]?.long,
        staked: findStaking(StakingKey.LPSTAKED, token),
        reward: findStaking(StakingKey.LPREWARD, token),
        withdrawable: fromLP,
      }
    })
    .filter(({ staked, reward }) =>
      [staked, reward].some((balance) => balance && gt(balance, 0))
    )

  const price = findPrice(priceKey, mir)
  const totalRewards = rewards.long
  const totalRewardsValue = times(rewards.long, price)
  const totalWithdrawableValue = sum(
    dataSource.map(({ withdrawable }) => withdrawable?.value ?? 0)
  )

  return {
    dataSource,
    totalRewards,
    totalRewardsValue,
    totalWithdrawableValue,
    isLoading: isLoading || isLoadingRewards,
  }
}
