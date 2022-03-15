import { useLCDClient } from "@terra-money/wallet-provider"
import { useQuery } from "react-query"

const REVERSE_RECORD_ADDRESS = "terra13efj2whf6rm7yedc2v7rnz0e6ltzytyhydy98a"

const useTnsName = (address: string) => {
  const lcd = useLCDClient()

  return useQuery(
    ["TnsReverseRecord", address],
    async () => {
      if (!address) return

      const { name } = await lcd.wasm.contractQuery<{ name: string | null }>(
        REVERSE_RECORD_ADDRESS,
        { get_name: { address } }
      )

      return name
    },
    { retry: false }
  )
}

export default useTnsName
