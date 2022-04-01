import { AccAddress } from "@terra-money/terra.js"
import { selector } from "recoil"
import { getContractQueryQuery } from "../utils/query"
import { protocolQuery } from "./protocol"

export interface ProxyItem {
  address: AccAddress
  provider_name: string
}

export const getProxyWhitelist = selector({
  key: "getProxyWhitelist",
  get: async ({ get }) => {
    const { contracts } = get(protocolQuery)
    const getContractQuery = get(getContractQueryQuery)
    return await getContractQuery<{ proxies: ProxyItem[] }>(
      { contract: contracts["oracleHub"], msg: { proxy_whitelist: {} } },
      "ProxyWhitelist"
    )
  },
})
