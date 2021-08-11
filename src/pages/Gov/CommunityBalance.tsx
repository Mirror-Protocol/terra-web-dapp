import Tooltips from "../../lang/Tooltips"
import Summary from "../../components/Summary"
import Formatted from "../../components/Formatted"
import useCommunityBalance from "../../data/contract/community"

const CommunityBalance = () => {
  const balance = useCommunityBalance()

  return (
    <Summary
      title="Community Pool"
      tooltip={Tooltips.Gov.CommunityPoolBalance}
      size="sm"
    >
      <Formatted symbol="MIR" integer>
        {balance}
      </Formatted>
    </Summary>
  )
}

export default CommunityBalance
