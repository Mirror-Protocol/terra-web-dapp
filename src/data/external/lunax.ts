import { useQuery } from "react-query"
import { selector } from "recoil"
import { useLCDClient } from "@terra-money/wallet-provider"
import { getContractQueryQuery } from "../utils/query"
import { protocolQuery, useProtocol } from "../contract/protocol"
import { networkNameState, useNetwork } from "../network"
import { addressState } from "../wallet"
import { useAddress } from "../../hooks"

const mainnet: ListedItemExternal = {
  symbol: "LunaX",
  token: "terra17y9qkl8dfkeg4py7n0g5407emqnemc3yqk5rup",
  icon: "https://raw.githubusercontent.com/stader-labs/assets/main/terra/LunaX_1.png",
  status: "LISTED",
}

const testnet: ListedItemExternal = {
  symbol: "LunaX",
  token: "terra1v0ypm2yc96alhn634pnwt4q4px482ukfqk02hx",
  icon: "https://raw.githubusercontent.com/stader-labs/assets/main/terra/LunaX_1.png",
  status: "LISTED",
}

export const useAsset = () => {
  const { name } = useNetwork()
  return { mainnet, testnet }[name]
}

export const assetQuery = selector({
  key: "LunaX.asset",
  get: ({ get }) => {
    const networkName = get(networkNameState)
    return { mainnet, testnet }[networkName]
  },
})

export const usePrice = () => {
  const lcd = useLCDClient()
  const asset = useAsset()
  const { contracts } = useProtocol()

  if (!asset) throw new Error("LunaX is not defined")

  const { data: result } = useQuery(
    ["collateralOraclePrice", contracts, asset],
    async () =>
      await lcd.wasm.contractQuery<{ rate: string }>(
        contracts["collateralOracle"],
        { collateral_price: { asset: asset.token } }
      )
  )
  return result?.rate ?? "0"
}

export const useBalance = () => {
  const lcd = useLCDClient()
  const address = useAddress()
  const asset = useAsset()

  if (!asset) throw new Error("LunaX is not defined")

  const { data: result } = useQuery(
    ["collateralOraclePrice", address, asset],
    async () =>
      await lcd.wasm.contractQuery<Balance>(asset.token, {
        balance: { address },
      })
  )
  return result?.balance ?? "0"
}

/* TODO: Delete query */

export const priceQuery = selector<string>({
  key: "LunaX.price",
  get: async ({ get }) => {
    const asset = get(assetQuery)
    const { contracts } = get(protocolQuery)
    const getQuery = get(getContractQueryQuery)

    if (!asset) throw new Error("LunaX is not defined")

    const result = await getQuery<{ rate: string }>(
      {
        contract: contracts["collateralOracle"],
        msg: { collateral_price: { asset: asset.token } },
      },
      "collateralOraclePrice" + asset.symbol
    )

    return result?.rate ?? "0"
  },
})

export const balanceQuery = selector<string>({
  key: "LunaX.balance",
  get: async ({ get }) => {
    const address = get(addressState)
    const asset = get(assetQuery)
    const getQuery = get(getContractQueryQuery)

    if (!asset) throw new Error("LunaX is not defined")

    const result = await getQuery<Balance>(
      { contract: asset.token, msg: { balance: { address } } },
      "balance" + asset.symbol
    )

    return result?.balance ?? "0"
  },
})
