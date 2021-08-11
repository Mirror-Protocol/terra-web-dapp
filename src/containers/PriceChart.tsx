import { Fragment } from "react"

import { format, formatAsset } from "../libs/parse"
import { div, minus } from "../libs/math"
import { percent } from "../libs/num"
import { PriceKey } from "../hooks/contractKeys"
import { useFindPrice, useLiquidity } from "../data/contract/normalize"
import AssetItem from "../components/AssetItem"
import { CardMain } from "../components/Card"

import styles from "./PriceChart.module.scss"

const PriceChart = ({ token, symbol }: { token: string; symbol: string }) => {
  const findPrice = useFindPrice()
  const price = findPrice(PriceKey.PAIR, token)
  const oraclePrice = findPrice(PriceKey.ORACLE, token)
  const liquidity = useLiquidity()
  const premium = oraclePrice ? minus(div(price, oraclePrice), 1) : undefined

  const details = [
    {
      title: "Oracle Price",
      content: oraclePrice ? `${format(oraclePrice)} UST` : undefined,
    },
    { title: "Premium", content: premium ? percent(premium) : undefined },
    { title: "Liquidity", content: formatAsset(liquidity[token], "uusd") },
  ]

  return (
    <div className={styles.component}>
      <CardMain>
        <AssetItem token={token}>
          <p>{format(price)} UST</p>
        </AssetItem>

        <dl className={styles.details}>
          {details.map(
            ({ title, content }) =>
              content && (
                <Fragment key={title}>
                  <dt>{title}</dt>
                  <dd>{content}</dd>
                </Fragment>
              )
          )}
        </dl>
      </CardMain>
    </div>
  )
}

export default PriceChart
