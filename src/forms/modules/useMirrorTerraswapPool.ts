import { useQuery } from "react-query"
import { useLCDClient } from "@terra-money/wallet-provider"
import { times, floor, gt, plus } from "../../libs/math"
import { format, formatAsset } from "../../libs/parse"
import calc from "../../libs/calc"
import { useProtocol } from "../../data/contract/protocol"
import { useNetwork } from "../../hooks"
import { calcPairPrice, parsePairPool } from "../../data/contract/normalize"

const useMirrorTerraswapPool = () => {
  const lcd = useLCDClient()
  const { getToken, getSymbol } = useProtocol()
  const { mirrorTerraswap } = useNetwork()
  const { pair } = mirrorTerraswap
  const { data: pairs } = useQuery([], () =>
    lcd.wasm.contractQuery<PairPool>(pair, { pool: {} })
  )

  const token = getToken("MIR")

  if (!pairs) return
  const price = calcPairPrice(pairs)

  /**
   * @param amount - Amount to provide(asset)/withdraw(lp)
   * @param token - Token of the asset to provide/withdraw
   */
  return (amount: string) => {
    /* pair pool */
    const pairPool = parsePairPool(pairs)

    /* estimate uusd */
    const estimated = gt(amount, 0) ? floor(times(amount, price)) : "0"

    /* to lp */
    const deposits = [
      { amount, pair: pairPool.asset },
      { amount: estimated, pair: pairPool.uusd },
    ]

    const toLP = calc.toLP(deposits, pairPool.total)

    /* from lp */
    const shares = {
      asset: { amount: pairPool.asset, token },
      uusd: { amount: pairPool.uusd, token: "uusd" },
    }

    const fromLP = calc.fromLP(amount, shares, pairPool.total)
    const assetValueFromLP = times(price, fromLP.asset.amount)
    const valueFromLP = plus(assetValueFromLP, fromLP.uusd.amount)

    return {
      toLP: {
        estimated,
        value: toLP,
        text: gt(estimated, 0) ? format(estimated, "uusd") : "0",
      },

      fromLP: {
        ...fromLP,
        value: valueFromLP,
        text: fromLP
          ? [fromLP.asset, fromLP.uusd]
              .map(({ amount, token }) => formatAsset(amount, getSymbol(token)))
              .join(" + ")
          : "0",
      },
    }
  }
}

export default useMirrorTerraswapPool
