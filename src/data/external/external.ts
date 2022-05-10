import { atom, selector } from "recoil"
import { useStoreLoadable } from "../utils/loadable"
import * as anchor from "./anchor"
import * as lunax from "./lunax"

export const useWhitelistExternal = () => {
  const anchorProtocol = anchor.useAnchorProtocol()
  const LunaXAsset = lunax.useAsset()
  return Object.assign(
    {},
    anchorProtocol.assets,
    LunaXAsset && { [LunaXAsset.token]: LunaXAsset }
  )
}

export const useExternalBalances = () => {
  const anchorBalances = anchor.useAnchorBalances()
  const LunaXAsset = lunax.useAsset()
  const LunaXBalance = lunax.useBalance()

  return Object.assign(
    {},
    anchorBalances,
    LunaXAsset && { [LunaXAsset.token]: LunaXBalance }
  )
}

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

/* store */
export const useExternalPrices = () => {
  return useStoreLoadable(externalPricesQuery, externalPricesState)
}
