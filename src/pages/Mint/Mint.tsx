import { useLocation } from "react-router-dom"
import useHash from "../../libs/useHash"
import { useMintPosition } from "../../data/contract/position"
import Page from "../../components/Page"
import Tab from "../../components/Tab"
import { MintType } from "../../types/Types"
import MintForm from "../../forms/MintForm"

interface Props {
  tabs?: MintType[]
}

const Mint = ({ tabs = [MintType.EDIT, MintType.CLOSE] }: Props) => {
  const { hash: type } = useHash<MintType>()
  const { search } = useLocation()
  const idx = new URLSearchParams(search).get("idx") || ""

  const parsed = useMintPosition(idx)
  const invalid = Boolean(idx && !parsed)

  return (
    <Page>
      {!invalid && (
        <Tab tabs={tabs} current={type}>
          <MintForm position={parsed} type={type} key={type} />
        </Tab>
      )}
    </Page>
  )
}

export default Mint
