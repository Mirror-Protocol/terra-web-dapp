import { useQuery } from "react-query"
import { useLCDClient } from "@terra-money/wallet-provider"
import { useProtocolAddress } from "./protocol"

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
      ),
    { enabled: !!contracts["mirrorToken"] }
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
    },
    { enabled: !!contracts["mirrorToken"] }
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
    },
    { enabled: !!contracts["mirrorToken"] }
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
      ),
    { enabled: !!contracts["community"] }
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
    },
    { enabled: !!contracts["factory"] }
  )
}

export const useGetDistributionWeight = () => {
  const { data: weights } = useFactoryDistributionInfo()
  return (token: string) => weights?.find(([addr]) => addr === token)?.[1]
}
