import { useQuery } from "react-query"
import { useLCDClient } from "@terra-money/wallet-provider"
import { useProtocolAddress } from "./protocol"

export const useLimitOrder = (id: number) => {
  const lcd = useLCDClient()
  const { data: protocolAddress } = useProtocolAddress()
  const contracts = protocolAddress?.contracts ?? {}
  return useQuery(
    ["limitOrder", lcd.config, id, contracts],
    async () =>
      await lcd.wasm.contractQuery<Order>(contracts["limitOrder"], {
        order: { order_id: id },
      }),
    { enabled: !!contracts["limitOrder"] }
  )
}
