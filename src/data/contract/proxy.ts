import { AccAddress } from "@terra-money/terra.js"
import { selector } from "recoil"
import { ORACLE_HUB } from "../../constants"
import { getContractQueryQuery } from "../utils/query"

export interface ProxyItem {
  address: AccAddress
  provider_name: string
}

export const getProxyWhitelist = selector({
  key: "getProxyWhitelist",
  get: async ({ get }) => {
    const getContractQuery = get(getContractQueryQuery)
    return await getContractQuery<{ proxies: ProxyItem[] }>(
      { contract: ORACLE_HUB, msg: { proxy_whitelist: {} } },
      "ProxyWhitelist"
    )
  },
})
