import { useQuery } from "react-query"
import { useLCDClient } from "@terra-money/wallet-provider"
import { useAddress } from "../../hooks"
import { useProtocolAddress } from "./protocol"

export const useMintPosition = (idx: string) => {
  const lcd = useLCDClient()
  const address = useAddress()
  const { data: protocolAddress } = useProtocolAddress()
  const contracts = protocolAddress?.contracts ?? {}
  return useQuery(
    ["mintPosition", lcd.config, contracts],
    async () =>
      await lcd.wasm.contractQuery<MintPosition>(contracts["mint"], {
        position: { position_idx: idx },
      }),
    { enabled: !!(address && idx) }
  )
}
