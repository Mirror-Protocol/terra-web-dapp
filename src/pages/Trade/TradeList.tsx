import Tooltips from "../../lang/Tooltips"
import { gt } from "../../libs/math"
import { PriceKey } from "../../hooks/contractKeys"
import { useProtocol } from "../../data/contract/protocol"
import { useTerraAssetList } from "../../data/list"

import Table from "../../components/Table"
import Formatted from "../../components/Formatted"
import Percent from "../../components/Percent"
import AssetItem from "../../components/AssetItem"
import { TooltipIcon } from "../../components/Tooltip"
import useListFilter from "../../components/useListFilter"
import AssetsIdleTable from "../../containers/AssetsIdleTable"
import { TradeType } from "../../types/Types"

const TradeList = () => {
  const { getSymbol } = useProtocol()
  const list = useTerraAssetList()
  const { filter, compare, renderSearch } = useListFilter()

  const dataSource = list
    .filter(({ name, symbol }) => [name, symbol].some(filter))
    .sort(compare)
    .sort((a, b) => Number(b.symbol === "MIR") - Number(a.symbol === "MIR"))

  return (
    <>
      {renderSearch()}
      {!list.length ? (
        <AssetsIdleTable />
      ) : (
        <Table
          rowKey="token"
          rows={({ token }) =>
            Object.assign(
              { to: { hash: TradeType.BUY, state: { token } } },
              getSymbol(token) === "MIR" && { background: "darker" }
            )
          }
          columns={[
            {
              key: "token",
              title: "Ticker",
              render: (token) => <AssetItem token={token} />,
              width: "25%",
              bold: true,
            },
            {
              key: PriceKey.PAIR,
              title: "Terraswap Price",
              render: (price) =>
                gt(price, 0) && <Formatted unit="UST">{price}</Formatted>,
              align: "right",
            },
            {
              key: PriceKey.ORACLE,
              title: "Oracle Price",
              render: (price) =>
                gt(price, 0) && <Formatted unit="UST">{price}</Formatted>,
              align: "right",
              desktop: true,
            },
            {
              key: "premium",
              title: (
                <TooltipIcon content={Tooltips.Trade.Premium}>
                  Premium
                </TooltipIcon>
              ),
              render: (value) => <Percent>{value}</Percent>,
              align: "right",
              desktop: true,
            },
          ]}
          dataSource={dataSource}
        />
      )}
    </>
  )
}

export default TradeList
