import { atom, selector, selectorFamily } from "recoil"
import { gte, sum } from "../../libs/math"
import { getContractQueryQuery } from "../utils/query"
import { useStore } from "../utils/loadable"
import { iterateAllPage } from "../utils/pagination"
import { addressState } from "../wallet"
import { protocolQuery } from "./protocol"
import { tokenBalancesQuery } from "./normalize"

export const LIMIT = 30

export const getQueryMintPositionsQuery = selectorFamily({
  key: "getQueryMintPositions",
  get:
    (params: {
      owner_addr?: string
      asset_token?: string
      order_by?: "asc" | "desc"
    }) =>
    async ({ get }) => {
      const { contracts } = get(protocolQuery)
      const getContractQuery = get(getContractQueryQuery)

      return async (offset?: string) => {
        const response = await getContractQuery<MintPositions>(
          {
            contract: contracts["mint"],
            msg: {
              positions: Object.assign(
                { ...params, limit: LIMIT },
                offset && { start_after: offset }
              ),
            },
          },
          ["mintPositions", offset, params.asset_token]
            .filter(Boolean)
            .join("-")
        )

        return response?.positions ?? []
      }
    },
})

export const mintPositionsQuery = selector({
  key: "mintPositions",
  get: async ({ get }) => {
    const address = get(addressState)

    if (address) {
      const query = get(getQueryMintPositionsQuery({ owner_addr: address }))
      return await iterateAllPage(query, (data) => data?.idx, LIMIT)
    }

    return []
  },
})

const mintPositionsState = atom<MintPosition[]>({
  key: "mintPositionsState",
  default: [],
})

export const shortPositionsQuery = selector({
  key: "shortPositions",
  get: ({ get }) => {
    const positions = get(mintPositionsQuery)
    return positions.filter(({ is_short }) => is_short)
  },
})

/* hooks */
export const useMintPositions = () => {
  return useStore(mintPositionsQuery, mintPositionsState)
}

/* cdps */
export const cdpsQuery = selectorFamily({
  key: "cdps",
  get:
    (asset_token: string) =>
    async ({ get }) => {
      const balance = get(tokenBalancesQuery)?.[asset_token]

      const toCDP = (position: MintPosition): CDP => {
        const { parseAssetInfo } = get(protocolQuery)
        const { idx: id, collateral, asset } = position
        const { token: collateralToken } = parseAssetInfo(collateral.info)
        const { amount: mintAmount } = asset
        return { id, collateralToken, mintAmount }
      }

      const query = get(
        getQueryMintPositionsQuery({ asset_token, order_by: "desc" })
      )

      const result = await iterateAllPage(
        query,
        (data) => data?.idx,
        LIMIT,
        (data) =>
          gte(sum(data.map(({ asset }) => asset.amount)), balance ?? "0")
      )

      return result.map(toCDP)
    },
})
