import { useQuery } from "react-query"
import { AccAddress } from "@terra-money/terra.js"
import { useLCDClient } from "@terra-money/wallet-provider"
import { useProtocolAddress } from "./protocol"

export interface ProxyItem {
  address: AccAddress
  provider_name: string
}

export const useGetProxyWhitelist = () => {
  const lcd = useLCDClient()
  const { data: protocolAddress } = useProtocolAddress()
  const contracts = protocolAddress?.contracts ?? {}
  return useQuery(
    ["getProxyWhitelist", lcd.config, contracts],
    async () =>
      await lcd.wasm.contractQuery<{ proxies: ProxyItem[] }>(
        contracts["oracleHub"],
        { proxy_whitelist: {} }
      )
  )
}
