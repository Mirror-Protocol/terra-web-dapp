import { useQuery } from "react-query"
import { useLCDClient } from "@terra-money/wallet-provider"
import { useAddress, useNetwork } from "../../hooks"
import { useProtocol } from "../contract/protocol"

interface AstroPendingRewards {
  pending: string // ASTRO
  pending_on_proxy: string // MIR
}

export const useAstroLpStakedBalance = () => {
  const address = useAddress()
  const lcd = useLCDClient()
  const { astro } = useNetwork()
  const { whitelist, getToken } = useProtocol()
  const { lpToken } = whitelist[getToken("MIR")]

  return useQuery(["AstroDeposit", address], () =>
    lcd.wasm.contractQuery<string>(astro.generator, {
      deposit: { lp_token: lpToken, user: address },
    })
  )
}

export const useAstroPendingRewards = () => {
  const address = useAddress()
  const lcd = useLCDClient()
  const { astro } = useNetwork()
  const { whitelist, getToken } = useProtocol()
  const { lpToken } = whitelist[getToken("MIR")]

  return useQuery(["AstroPendingRewards", address], () =>
    lcd.wasm.contractQuery<AstroPendingRewards>(astro.generator, {
      pending_token: { lp_token: lpToken, user: address },
    })
  )
}
