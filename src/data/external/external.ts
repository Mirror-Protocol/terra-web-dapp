import { atom, selector } from "recoil"
import { useStore, useStoreLoadable } from "../utils/loadable"
import * as anchor from "./anchor"
import * as lunax from "./lunax"

export const whitelistExternalQuery = selector({
  key: "whitelistExternal",
  get: ({ get }) => {
    const anchorProtocol = get(anchor.anchorProtocolQuery)
    const LunaXAsset = get(lunax.assetQuery)

    return Object.assign(
      {},
      anchorProtocol.assets,
      LunaXAsset && { [LunaXAsset.token]: LunaXAsset }
    )
  },
})

export const externalPricesQuery = selector({
  key: "externalPrices",
  get: ({ get }) => {
    const anchorPrices = get(anchor.anchorPricesQuery)
    const LunaXAsset = get(lunax.assetQuery)
    const LunaXPrice = get(lunax.priceQuery)

    return Object.assign(
      {},
      anchorPrices,
      LunaXAsset && { [LunaXAsset.token]: LunaXPrice }
    )
  },
})

const externalPricesState = atom<Dictionary>({
  key: "externalPricesState",
  default: {},
})

export const externalBalancesQuery = selector({
  key: "externalBalances",
  get: ({ get }) => {
    const anchorBalances = get(anchor.anchorBalancesQuery)
    const LunaXAsset = get(lunax.assetQuery)
    const LunaXBalance = get(lunax.balanceQuery)

    return Object.assign(
      {},
      anchorBalances,
      LunaXAsset && { [LunaXAsset.token]: LunaXBalance }
    )
  },
})

const externalBalancesState = atom<Dictionary>({
  key: "externalBalancesState",
  default: {},
})

/* store */
export const useExternalPrices = () => {
  return useStoreLoadable(externalPricesQuery, externalPricesState)
}

export const useExternalBalances = () => {
  return useStore(externalBalancesQuery, externalBalancesState)
}
