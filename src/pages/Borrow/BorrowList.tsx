import Tooltips from "../../lang/Tooltips"
import { gt } from "../../libs/math"
import { PriceKey } from "../../hooks/contractKeys"
import { useTerraAssetList } from "../../data/list"
import Table from "../../components/Table"
import Formatted from "../../components/Formatted"
import Percent from "../../components/Percent"
import AssetItem from "../../components/AssetItem"
import useListFilter from "../../components/useListFilter"
import { TooltipIcon } from "../../components/Tooltip"
import AssetsIdleTable from "../../containers/AssetsIdleTable"
import { MintType } from "../../types/Types"

const BorrowList = () => {
  const list = useTerraAssetList()
  const { filter, compare, renderSearch } = useListFilter()

  const dataSource = list
    .filter(({ symbol }) => symbol !== "MIR")
    .filter(({ name, symbol }) => [name, symbol].some(filter))
    .sort(compare)

  return (
    <>
      {renderSearch()}
      {!list.length ? (
        <AssetsIdleTable />
      ) : (
        <Table
          rowKey="token"
          rows={({ token }) => ({
            to: { hash: MintType.BORROW, state: { token } },
          })}
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
              desktop: true,
            },
            {
              key: PriceKey.ORACLE,
              title: "Oracle Price",
              render: (price) =>
                gt(price, 0) && <Formatted unit="UST">{price}</Formatted>,
              align: "right",
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
            {
              key: "minCollateralRatio",
              title: (
                <TooltipIcon content={Tooltips.Mint.MinimumCollateralRatio}>
                  Min. Col. Ratio
                </TooltipIcon>
              ),
              render: (value) => <Percent dp={0}>{value}</Percent>,
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

export default BorrowList
