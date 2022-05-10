import { useQuery } from "react-query"
import { selector } from "recoil"
import { useLCDClient } from "@terra-money/wallet-provider"
import { useAddress } from "../../hooks"
import {
  getListedContractQueriesQuery,
  useGetListedContractQueries,
} from "../utils/queries"
import { addressState } from "../wallet"
import { useNetwork } from "../network"
import { useProtocolAddress } from "./protocol"

export const usePairPool = () => {
  const getListedContractQueries = useGetListedContractQueries()
  const { name } = useNetwork()
  return useQuery(
    ["pairPool", name],
    async () =>
      await getListedContractQueries<PairPool>(
        ({ token, pair }) => ({ token, contract: pair, msg: { pool: {} } }),
        "pairPool"
      )
  )
}

export const useOraclePrice = () => {
  const { data: protocolAddress } = useProtocolAddress()
  const getListedContractQueries = useGetListedContractQueries()
  const contracts = protocolAddress?.contracts ?? {}
  return useQuery(
    ["oraclePrice", contracts],
    async () =>
      await getListedContractQueries<Rate>(
        ({ token, symbol }) =>
          symbol === "MIR"
            ? undefined
            : {
                contract: contracts["oracleHub"],
                msg: { price: { asset_token: token } },
              },
        "oraclePrice"
      ),
    { enabled: !!contracts["oracleHub"] }
  )
}

export const useMintAssetConfig = () => {
  const { data: protocolAddress } = useProtocolAddress()
  const getListedContractQueries = useGetListedContractQueries()
  const contracts = protocolAddress?.contracts ?? {}

  return useQuery(
    ["mintAssetConfig", contracts],
    async () =>
      await getListedContractQueries<MintAssetConfig>(
        ({ token, symbol }) =>
          symbol === "MIR"
            ? undefined
            : {
                contract: contracts["mint"],
                msg: { asset_config: { asset_token: token } },
              },
        "mintAssetConfig"
      ),
    { enabled: !!contracts["mint"] }
  )
}

export const useTokenBalance = () => {
  const address = useAddress()
  const { name } = useNetwork()
  const getListedContractQueries = useGetListedContractQueries()
  return useQuery(
    ["tokenBalance", address, name],
    async () =>
      await getListedContractQueries<Balance>(
        ({ token }) => ({ contract: token, msg: { balance: { address } } }),
        "tokenBalance"
      )
  )
}

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

export const useLpTokenBalance = () => {
  const address = useAddress()
  const getListedContractQueries = useGetListedContractQueries()
  return useQuery(
    ["lpTokenBalance", address],
    async () =>
      await getListedContractQueries<Balance>(
        ({ lpToken }) => ({ contract: lpToken, msg: { balance: { address } } }),
        "lpTokenBalance"
      )
  )
}

export const useStakingRewardInfo = () => {
  const lcd = useLCDClient()
  const address = useAddress()
  const { data: protocolAddress } = useProtocolAddress()
  const contracts = protocolAddress?.contracts ?? {}
  return useQuery(
    ["stakingRewardInfo", address, contracts, protocolAddress, lcd.config],
    async () =>
      await lcd.wasm.contractQuery<StakingRewardInfo>(contracts["staking"], {
        reward_info: { staker_addr: address },
      }),
    { enabled: !!contracts["staking"] }
  )
}

export const useGovStaker = () => {
  const lcd = useLCDClient()
  const address = useAddress()
  const { data: protocolAddress } = useProtocolAddress()
  const contracts = protocolAddress?.contracts ?? {}
  return useQuery(
    ["govStaker", address, protocolAddress, contracts, lcd.config],
    async () =>
      await lcd.wasm.contractQuery<GovStaker>(contracts["gov"], {
        staker: { address },
      }),
    { enabled: !!contracts["gov"] }
  )
}
