import useNewContractMsg from "../libs/useNewContractMsg"
import { gt, plus } from "../libs/math"
import { useProtocol } from "../data/contract/protocol"
import { useFindBalance } from "../data/contract/normalize"
import { useRewards } from "../data/my/rewards"
import { useAstroPendingRewards } from "../data/external/astroport"
import { useAddress, useNetwork } from "../hooks"
import Formatted from "../components/Formatted"
import Container from "../components/Container"
import useClaimRewardsReceipt from "./receipts/useClaimRewardsReceipt"
import FormContainer from "./modules/FormContainer"

const ClaimRewardsForm = () => {
  /* context */
  const address = useAddress()
  const { whitelist, contracts, getToken } = useProtocol()
  const { astro } = useNetwork()
  const { contents: findBalance } = useFindBalance()
  const { contents: rewards } = useRewards()
  const { data: astroPendingRewards } = useAstroPendingRewards()

  const balance = findBalance(getToken("MIR"))
  const claiming = plus(rewards.total, astroPendingRewards?.pending_on_proxy)

  /* confirm */
  const astroRewards = (
    <Formatted symbol="ASTRO">{astroPendingRewards?.pending}</Formatted>
  )

  const contents = [
    {
      title: "Claiming",
      content: (
        <>
          <Formatted symbol="MIR">{claiming}</Formatted>
          {gt(astroPendingRewards?.pending ?? 0, 0) && <> + {astroRewards}</>}
        </>
      ),
    },
    {
      title: "MIR after Tx",
      content: <Formatted symbol="MIR">{plus(balance, claiming)}</Formatted>,
    },
  ]

  /* submit */
  const newContractMsg = useNewContractMsg()
  const withdraw = {
    staking: newContractMsg(contracts["staking"], { withdraw: {} }),
    voting: newContractMsg(contracts["gov"], { withdraw_voting_rewards: {} }),
  }

  const { lpToken: astroLpToken } = whitelist[getToken("MIR")]
  const dataAstro = newContractMsg(astro.generator, {
    withdraw: { account: address, amount: "0", lp_token: astroLpToken },
  })

  const dataMIR =
    gt(plus(rewards.long, rewards.short), 0) && gt(rewards.voting, 0)
      ? [withdraw.staking, withdraw.voting]
      : gt(rewards.voting, 0)
      ? [withdraw.voting]
      : gt(plus(rewards.long, rewards.short), 0)
      ? [withdraw.staking]
      : []

  const data =
    gt(astroPendingRewards?.pending ?? 0, 0) ||
    gt(astroPendingRewards?.pending_on_proxy ?? 0, 0)
      ? [dataAstro, ...dataMIR]
      : dataMIR

  const disabled = !(
    gt(claiming, 0) || gt(astroPendingRewards?.pending ?? 0, 0)
  )

  /* result */
  const parseTx = useClaimRewardsReceipt()

  const container = { contents, disabled, data, parseTx, gasAdjust: 1.5 }
  const props = { tab: { tabs: ["Claim"], current: "Claim" }, label: "Claim" }

  return (
    <Container sm>
      <FormContainer {...container} {...props} />
    </Container>
  )
}

export default ClaimRewardsForm
