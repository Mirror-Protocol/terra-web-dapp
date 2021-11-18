import { uniq } from "ramda"
import { useProtocol } from "../data/contract/protocol"
import { useMyTotal } from "../data/my/total"
import DelistModal from "./DelistModal"

const DelistAlert = () => {
  const { delist } = useProtocol()
  const filterDelist = (token: string) => delist[token]?.type === "DELIST"
  const filterStockEvent = (token: string) =>
    delist[token]?.type === "STOCKEVENT"

  const { holding, borrowing, farming, short, limitOrder } = useMyTotal()

  const tokens = uniq([
    ...holding.dataSource.map(({ token }) => token),
    ...borrowing.dataSource.map(({ collateralAsset }) => collateralAsset.token),
    ...borrowing.dataSource.map(({ mintedAsset }) => mintedAsset.token),
    ...farming.dataSource.map(({ token }) => token),
    ...short.dataSource.map(({ token }) => token),
    ...limitOrder.dataSource.map(({ token }) => token),
  ])

  const delistTokens = tokens.filter(filterDelist)
  const stockEventTokens = tokens.filter(filterStockEvent)

  return delistTokens.length ? (
    <DelistModal type="DELIST" tokens={delistTokens} />
  ) : stockEventTokens.length ? (
    <DelistModal type="STOCKEVENT" tokens={stockEventTokens} />
  ) : null
}

export default DelistAlert
