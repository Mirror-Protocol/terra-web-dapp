import { minus, isFinite, plus } from "../../libs/math"
import { useGovState } from "./state"
import { useMirrorTokenGovBalance } from "../contract/info"

export const useTotalStaked = () => {
  const state = useGovState()
  const balance = useMirrorTokenGovBalance()

  if (!(balance && state)) return "0"
  const { total_deposit, pending_voting_rewards } = state
  return [balance, total_deposit, pending_voting_rewards].every(isFinite)
    ? minus(balance, plus(total_deposit, pending_voting_rewards))
    : "0"
}
