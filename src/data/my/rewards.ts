import { selector } from "recoil"
import { sum } from "../../libs/math"
import { govStakerQuery, useGovStaker } from "../contract/contract"
import { missingRewardsQuery } from "../contract/gov"
import { useLpRewardBalances } from "../contract/normalize"
import { useSlpRewardBalances } from "../contract/normalize"

export const useFarmingRewards = () => {
  const long = useLpRewardBalances()
  const short = useSlpRewardBalances()
  return {
    long: sum(Object.values(long ?? {})),
    short: sum(Object.values(short ?? {})),
  }
}

export const useVotingRewards = () => {
  const { data: govStaker } = useGovStaker()
  return govStaker?.pending_voting_rewards ?? "0"
}

export const votingRewardsQuery = selector({
  key: "votingRewards",
  get: ({ get }) => get(govStakerQuery)?.pending_voting_rewards ?? "0",
})

export const missingRewardsTotalQuery = selector({
  key: "missingRewardsTotal",
  get: ({ get }) => {
    const missingRewards = get(missingRewardsQuery)
    return sum(missingRewards.map(({ reward }) => reward ?? 0))
  },
})

export const useRewards = () => {
  const { long, short } = useFarmingRewards()
  const voting = useVotingRewards()
  const total = sum([long, short, voting])
  return { long, short, voting, total }
}
