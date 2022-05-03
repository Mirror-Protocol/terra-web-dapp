import { useLCDClient } from "@terra-money/wallet-provider"
import { useQuery } from "react-query"
import { selector } from "recoil"
import { getContractQueryQuery } from "../utils/query"
import { protocolQuery, useProtocolAddress } from "./protocol"

export const useMirrorTokenInfo = () => {
  const lcd = useLCDClient()
  const { data: protocolAddress } = useProtocolAddress()
  const contracts = protocolAddress?.contracts ?? {}

  return useQuery(
    ["mirrorTokenInfo", lcd.config, contracts],
    async () =>
      await lcd.wasm.contractQuery<{ total_supply: string }>(
        contracts["mirrorToken"],
        { token_info: {} }
      )
  )
}

export const useMirrorTokenGovBalance = () => {
  const lcd = useLCDClient()
  const { data: protocolAddress } = useProtocolAddress()
  const contracts = protocolAddress?.contracts ?? {}

  return useQuery(
    ["mirrorTokenGovBalance", lcd.config, contracts],
    async () => {
      const { balance } = await lcd.wasm.contractQuery<Balance>(
        contracts["mirrorToken"],
        {
          balance: { address: contracts["gov"] },
        }
      )
      return balance
    }
  )
}

export const useMirrorTokenCommunityBalance = () => {
  const lcd = useLCDClient()
  const { data: protocolAddress } = useProtocolAddress()
  const contracts = protocolAddress?.contracts ?? {}

  return useQuery(
    ["mirrorTokenCommunityBalance", lcd.config, contracts],
    async () => {
      const { balance } = await lcd.wasm.contractQuery<Balance>(
        contracts["mirrorToken"],
        {
          balance: { address: contracts["community"] },
        }
      )
      return balance
    }
  )
}

export const useCommunityConfig = () => {
  const lcd = useLCDClient()
  const { data: protocolAddress } = useProtocolAddress()
  const contracts = protocolAddress?.contracts ?? {}

  return useQuery(
    ["communityConfig", lcd.config, contracts],
    async () =>
      await lcd.wasm.contractQuery<{ spend_limit: string }>(
        contracts["community"],
        { config: {} }
      )
  )
}

export const useFactoryDistributionInfo = () => {
  const lcd = useLCDClient()
  const { data: protocolAddress } = useProtocolAddress()
  const contracts = protocolAddress?.contracts ?? {}

  return useQuery(
    ["factoryDistributionInfo", lcd.config, contracts],
    async () => {
      const { weights } = await lcd.wasm.contractQuery<{
        weights: DistributionWeight[]
      }>(contracts["factory"], { distribution_info: {} })

      return weights
    }
  )
}

export const factoryDistributionInfoQuery = selector({
  key: "factoryDistributionInfo",
  get: async ({ get }) => {
    const { contracts } = get(protocolQuery)
    const getContractQuery = get(getContractQueryQuery)
    const response = await getContractQuery<{ weights: DistributionWeight[] }>(
      {
        contract: contracts["factory"],
        msg: { distribution_info: {} },
      },
      "factoryDistributionInfo"
    )

    return response?.weights
  },
})

export const getDistributionWeightQuery = selector({
  key: "getDistributionWeight",
  get: ({ get }) => {
    const weights = get(factoryDistributionInfoQuery)
    return (token: string) => weights?.find(([addr]) => addr === token)?.[1]
  },
})
