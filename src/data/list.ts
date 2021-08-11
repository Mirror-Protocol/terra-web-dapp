import { PriceKey } from "../hooks/contractKeys"
import { div, gt, minus } from "../libs/math"
import { useAssetsAPR } from "./apr/apr"
import { useFindPrice, useLiquidity } from "./contract/normalize"
import { useMinCollateralRatio } from "./contract/normalize"
import { useProtocol } from "./contract/protocol"

type FarmingType = "long" | "short"

export interface DefaultItem extends ListedItem {
  [PriceKey.PAIR]: string
  [PriceKey.ORACLE]?: string
  premium?: string

  liquidity: string
  minCollateralRatio: string
  apr: { long: string; short?: string }

  recommended: FarmingType
}

export interface Item extends DefaultItem {
  change?: number
}

export const useTerraAssetList = () => {
  const { listed } = useProtocol()
  const findPrice = useFindPrice()
  const liquidity = useLiquidity()
  const minCollateralRatio = useMinCollateralRatio()
  const assetsAPR = useAssetsAPR()

  return listed
    .map((item): Item => {
      const { token } = item
      const pairPrice = findPrice(PriceKey.PAIR, token)
      const oraclePrice = findPrice(PriceKey.ORACLE, token)
      const assetAPR = assetsAPR[token]
      const long = assetAPR?.long
      const short = assetAPR?.short

      return {
        ...item,
        [PriceKey.PAIR]: pairPrice,
        [PriceKey.ORACLE]: oraclePrice,
        premium: oraclePrice
          ? minus(div(pairPrice, oraclePrice), 1)
          : undefined,
        liquidity: liquidity[token],
        apr: { long, short },
        recommended: long && short && gt(short, long) ? "short" : "long",
        minCollateralRatio: minCollateralRatio[token],
      }
    })
    .filter(({ liquidity }) => !liquidity || gt(liquidity, 0))
}
