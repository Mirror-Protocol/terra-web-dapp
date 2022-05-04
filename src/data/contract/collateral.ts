import { selector } from "recoil"
import { gt, times } from "../../libs/math"
import { decimal } from "../../libs/parse"
import { PriceKey } from "../../hooks/contractKeys"
import { useWhitelistExternal } from "../external/external"
import { useGetTokensContractQueries } from "../utils/queries"
import { useMinCollateralRatio, useMultipliers } from "./normalize"
import { protocolQuery, useProtocol } from "./protocol"

export const getMintPriceKeyQuery = selector({
  key: "getMintPriceKey",
  get: ({ get }) => {
    const { getSymbol, ...helpers } = get(protocolQuery)
    const { getIsPreIPO, getIsDelisted, getIsExternal } = helpers

    return (token: string) =>
      getIsExternal(token)
        ? PriceKey.EXTERNAL
        : getSymbol(token) === "MIR"
        ? PriceKey.PAIR
        : getIsPreIPO(token)
        ? PriceKey.PRE
        : getIsDelisted(token)
        ? PriceKey.END
        : PriceKey.ORACLE
  },
})

export const useCollateralOracleAssetInfo = () => {
  const { contracts, listed } = useProtocol()
  const whitelistExternal = useWhitelistExternal()

  const tokens = [
    "uluna",
    ...listed
      .filter(({ status }) => status !== "PRE_IPO")
      .map(({ token }) => token),
    ...Object.keys(whitelistExternal),
  ]

  const getListedContractQueries = useGetTokensContractQueries(tokens)
  return getListedContractQueries<CollateralOracleAssetInfo>(
    (token) => ({
      contract: contracts["collateralOracle"],
      msg: { collateral_asset_info: { asset: token } },
    }),
    "collateralOracleAssetInfo"
  )
}

/* find */
export const useGetMinRatio = () => {
  const { getIsDelisted } = useProtocol()
  const minCollateralRatio = useMinCollateralRatio()
  const multipliers = useMultipliers()

  return (collateralToken: string, assetToken: string) => {
    const minRatio = minCollateralRatio[assetToken]
    const multiplier = multipliers[collateralToken]
    const valid = gt(minRatio, 0) && gt(multiplier, 0)

    return !valid
      ? "0"
      : getIsDelisted(assetToken)
      ? minRatio
      : decimal(times(minRatio, multiplier), 4)
  }
}
