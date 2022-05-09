import { useLCDClient } from "@terra-money/wallet-provider"
import { useQuery } from "react-query"
import { useProtocolAddress } from "../contract/protocol"

const INITIAL = { poll_count: 0, total_share: "0", total_deposit: "0" }

export const useGovState = () => {
  const lcd = useLCDClient()
  const { data: protocolAddress } = useProtocolAddress()
  const contracts = protocolAddress?.contracts ?? {}

  const { data } = useQuery(
    ["govState", lcd.config, contracts],
    async () =>
      await lcd.wasm.contractQuery<GovState>(contracts["gov"], { state: {} }),
    { enabled: !!contracts["gov"] }
  )

  return data ?? INITIAL
}
