import { useQuery } from "react-query"
import { useLCDClient } from "@terra-money/wallet-provider"
import { iterateAllPage } from "../utils/pagination"
import { useProtocolAddress } from "./protocol"
import { useAddress } from "../../hooks"

export const LIMIT = 30

export const useLimitOrders = () => {
  const lcd = useLCDClient()
  const address = useAddress()
  const { data: protocolAddress } = useProtocolAddress()
  const contracts = protocolAddress?.contracts ?? {}

  const query = async (offset?: number) => {
    const response = await lcd.wasm.contractQuery<{ orders: Order[] }>(
      contracts["limitOrder"],
      {
        orders: {
          bidder_addr: address,
          limit: LIMIT,
          start_after: offset,
        },
      }
    )
    return response?.orders ?? []
  }
  //TODO Offset key
  return useQuery(
    ["limitOrders", lcd.config, address, contracts],
    async () => await iterateAllPage(query, (data) => data?.order_id, LIMIT)
  )
}
