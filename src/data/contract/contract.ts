import { useQuery } from "react-query"
import { selector } from "recoil"
import { useLCDClient } from "@terra-money/wallet-provider"
import { useAddress } from "../../hooks"
import {
  getListedContractQueriesQuery,
  useGetListedContractQueries,
} from "../utils/queries"
import { priceKeyIndexState } from "../app"
import { addressState } from "../wallet"
import { protocolQuery, useProtocolAddress } from "./protocol"

export const usePairPool = () => {
  const getListedContractQueries = useGetListedContractQueries()
  return getListedContractQueries<PairPool>(
    ({ token, pair }) => ({ token, contract: pair, msg: { pool: {} } }),
    "pairPool"
  )
}

export const pairPoolQuery = selector({
  key: "pairPool",
  get: async ({ get }) => {
    get(priceKeyIndexState)
    const getListedContractQueries = get(getListedContractQueriesQuery)
    return await getListedContractQueries<PairPool>(
      ({ token, pair }) => ({ token, contract: pair, msg: { pool: {} } }),
      "pairPool"
    )
  },
})

export const oraclePriceQuery = selector({
  key: "oraclePrice",
  get: async ({ get }) => {
    const { contracts } = get(protocolQuery)
    const getListedContractQueries = get(getListedContractQueriesQuery)
    return await getListedContractQueries<Rate>(
      ({ token, symbol }) =>
        symbol === "MIR"
          ? undefined
          : {
              contract: contracts["oracleHub"],
              msg: { price: { asset_token: token } },
            },
      "oraclePrice"
    )
  },
})

export const mintAssetConfigQuery = selector({
  key: "mintAssetConfig",
  get: async ({ get }) => {
    const { contracts } = get(protocolQuery)
    const getListedContractQueries = get(getListedContractQueriesQuery)
    return await getListedContractQueries<MintAssetConfig>(
      ({ token, symbol }) =>
        symbol === "MIR"
          ? undefined
          : {
              contract: contracts["mint"],
              msg: { asset_config: { asset_token: token } },
            },
      "mintAssetConfig"
    )
  },
})

export const tokenBalanceQuery = selector({
  key: "tokenBalance",
  get: async ({ get }) => {
    const address = get(addressState)

    if (address) {
      const getListedContractQueries = get(getListedContractQueriesQuery)
      return await getListedContractQueries<Balance>(
        ({ token }) => ({ contract: token, msg: { balance: { address } } }),
        "tokenBalance"
      )
    }
  },
})

export const lpTokenBalanceQuery = selector({
  key: "lpTokenBalance",
  get: async ({ get }) => {
    const address = get(addressState)

    if (address) {
      const getListedContractQueries = get(getListedContractQueriesQuery)
      return await getListedContractQueries<Balance>(
        ({ lpToken }) => ({ contract: lpToken, msg: { balance: { address } } }),
        "lpTokenBalance"
      )
    }
  },
})

export const useStakingRewardInfo = () => {
  const lcd = useLCDClient()
  const address = useAddress()
  const { data: protocolAddress } = useProtocolAddress()
  const contract = protocolAddress?.contracts["staking"] ?? ""
  return useQuery(
    ["stakingRewardInfo", address, contract, protocolAddress, lcd.config],
    async () =>
      await lcd.wasm.contractQuery<StakingRewardInfo>(contract, {
        reward_info: { staker_addr: address },
      })
  )
}

export const useGovStaker = () => {
  const lcd = useLCDClient()
  const address = useAddress()
  const { data: protocolAddress } = useProtocolAddress()
  const contract = protocolAddress?.contracts["gov"] ?? ""
  return useQuery(
    ["govStaker", address, protocolAddress, contract, lcd.config],
    async () =>
      await lcd.wasm.contractQuery<GovStaker>(contract, { staker: { address } })
  )
}
