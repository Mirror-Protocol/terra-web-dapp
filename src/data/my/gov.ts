import { gt, times } from "../../libs/math"
import { PriceKey } from "../../hooks/contractKeys"
import { uniqByKey } from "../utils/pagination"
import { useProtocol } from "../contract/protocol"
import { useGovStaker } from "../contract/contract"
import { useMissingRewards, VoteHistoryItem } from "../contract/gov"
import { useFindPrice, useGovStaked } from "../contract/normalize"
import { usePollsByIds } from "../gov/polls"

const useVoteHistory = (): {
  contents: VoteHistoryItem[]
  isLoading: boolean
} => {
  const { contents: govStaker, isLoading: isLoadingStaker } = useGovStaker()
  const { contents: missingRewards, isLoading: isMissingRewardsLoading } =
    useMissingRewards()

  const ids = !govStaker
    ? []
    : [
        ...govStaker.locked_balance.map(([id]) => id),
        ...govStaker.withdrawable_polls.map(([id]) => id),
      ]

  const { contents: pollsByIds, isLoading: isLoadingPolls } = usePollsByIds(ids)
  const pollsByIdsValues = Object.values(pollsByIds)

  return {
    isLoading: isLoadingStaker || isMissingRewardsLoading || isLoadingPolls,
    contents: !govStaker
      ? []
      : uniqByKey(
          [
            ...govStaker.locked_balance.map(([id, voter]) => {
              return {
                ...pollsByIdsValues.find((poll) => poll.id === id)!,
                ...voter,
                id,
              }
            }),
            ...govStaker.withdrawable_polls.map(([id, reward]) => {
              return {
                ...pollsByIdsValues.find((poll) => poll.id === id)!,
                reward,
                id,
              }
            }),
            ...missingRewards,
          ],
          "id"
        ).sort(({ id: a }, { id: b }) => b - a),
  }
}

export const useMyGov = () => {
  const priceKey = PriceKey.PAIR

  const { getToken } = useProtocol()
  const mir = getToken("MIR")

  const findPrice = useFindPrice()
  const { contents: govStaked, isLoading: isLoadingStaked } = useGovStaked()
  const { contents: govStaker, isLoading: isLoadingStaker } = useGovStaker()
  const { contents: dataSource, isLoading: isLoadingHistory } = useVoteHistory()

  const price = findPrice(priceKey, mir)
  const valid = gt(govStaked, 1)

  const staked = valid ? govStaked : "0"
  const stakedValue = valid ? times(staked, price) : "0"

  const votingRewards = govStaker?.pending_voting_rewards ?? "0"
  const votingRewardsValue = times(votingRewards, price)

  return {
    dataSource,
    staked,
    stakedValue,
    votingRewards,
    votingRewardsValue,
    isLoading: isLoadingStaked || isLoadingStaker || isLoadingHistory,
  }
}
