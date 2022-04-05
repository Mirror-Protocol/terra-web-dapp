import { useMemo } from "react"
import { useQuery } from "react-query"
import { useLCDClient } from "@terra-money/wallet-provider"
import { useProtocol } from "../../data/contract/protocol"

const useGetIsMarketClosed = (token: string) => {
  const { contracts, getIsDelisted, getSymbol } = useProtocol()
  const symbol = getSymbol(token)

  //TODO: Fix
  const skip = ["uusd", "uluna", "aUST", "LunaX"].includes(symbol)

  const lcd = useLCDClient()
  const { data } = useQuery(
    ["MarketClose", contracts["oracleHub"], token],
    async () =>
      await lcd.wasm.contractQuery<Rate>(contracts["oracleHub"], {
        price: { asset_token: token },
      }),
    { enabled: !skip }
  )

  const now = useMemo(() => {
    if (!data) return 0
    return new Date().valueOf()
  }, [data])

  // false === market is opened
  // true === market is closed

  if (data) {
    const { last_updated } = data
    const sec = Math.floor(now / 1000) - last_updated
    return sec > 60 || getIsDelisted(token)
  }

  return skip ? false : true
}

export default useGetIsMarketClosed
