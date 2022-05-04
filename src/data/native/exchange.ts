import { useQuery } from "react-query"
import { useLCDClient } from "@terra-money/wallet-provider"

export const useExchangeRates = () => {
  const lcd = useLCDClient()
  return useQuery(
    ["oracleDenomsExchangeRates", lcd.config],
    async () => await lcd.oracle.exchangeRates()
  )
}
