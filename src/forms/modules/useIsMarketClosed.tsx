import { useQuery } from "react-query"
import { useLCDClient } from "@terra-money/wallet-provider"
import { useProtocol } from "../../data/contract/protocol"

const useIsMarketClosed = (token: string) => {
  const { contracts, getIsDelisted } = useProtocol()

  const lcd = useLCDClient()
  const { data } = useQuery(
    ["MarketClose", contracts["oracleHub"], token],
    async () =>
      await lcd.wasm.contractQuery<Rate>(contracts["oracleHub"], {
        price: { asset_token: token },
      }),
    { enabled: token !== "uusd" }
  )

  // false === market is open
  // true === market is closed

  if (token === "uusd") return false

  if (data) {
    const { last_updated } = data
    const sec = Math.floor(new Date().valueOf() / 1000) - last_updated
    return sec > 60 && getIsDelisted(token)
  }

  return true
}

export default useIsMarketClosed
