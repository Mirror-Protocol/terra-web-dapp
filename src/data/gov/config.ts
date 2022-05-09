import { useQuery } from "react-query"
import { useLCDClient } from "@terra-money/wallet-provider"
import { useProtocolAddress } from "../contract/protocol"

export const useGovConfig = () => {
  const lcd = useLCDClient()
  const { data: protocolAddress } = useProtocolAddress()
  const contracts = protocolAddress?.contracts ?? {}

  return useQuery(
    ["govConfig", lcd.config, contracts],
    async () =>
      await lcd.wasm.contractQuery<GovConfig>(contracts["gov"], { config: {} }),
    { enabled: !!contracts["gov"] }
  )
}
