import { useQuery } from "react-query"
import { selector, selectorFamily, useRecoilValue } from "recoil"
import { request } from "graphql-request"
import { ClientError, RequestDocument } from "graphql-request/dist/types"
import alias from "../contract/alias"
import { protocolQuery } from "../contract/protocol"
import { locationKeyState } from "../app"
import { mantleURLQuery, useMantleURL } from "../network"
import { parseResults } from "./parse"

export const LUNA: ListedItem = {
  token: "uluna",
  symbol: "Luna",
  name: "Luna",
  pair: "",
  lpToken: "",
  status: "LISTED",
}

export const useGetTokensContractQueries = (tokens: string[]) => {
  const getContractQueries = useGetContractQueries()
  return <Parsed>(fn: (token: string) => ContractVariables, name: string) => {
    const document = alias(
      tokens.map((token) => ({ name: token, ...fn(token) })),
      name
    )

    return getContractQueries<Parsed>(document, name)
  }
}

export const useGetContractQueries = () => {
  const url = useMantleURL()

  const useContractQueries = <Parsed>(
    document: RequestDocument,
    name: string
  ) =>
    useQuery([url, document, name], async () => {
      const result = await request<Dictionary<ContractData | null> | null>(
        url + "?" + name,
        document
      )
      return result ? parseResults<Parsed>(result) : undefined
    })

  return useContractQueries
}

export const useGetListedContractQueries = () => {
  const { listedAll } = useRecoilValue(protocolQuery)
  const getContractQueries = useGetContractQueries()

  return <Parsed>(fn: GetDocument, name: string) => {
    const document = alias(
      listedAll
        .filter((item) => fn(item))
        .map((item) => ({ name: item.token, ...fn(item) })),
      name
    )

    return getContractQueries<Parsed>(document, name)
  }
}

/* TODO: Remove */
export const getTokensContractQueriesQuery = selectorFamily({
  key: "getTokensContractQueries",
  get:
    (tokens: string[]) =>
    ({ get }) => {
      const getContractQueries = get(getContractQueriesQuery)

      return async <Parsed>(
        fn: (token: string) => ContractVariables,
        name: string
      ) => {
        const document = alias(
          tokens.map((token) => ({ name: token, ...fn(token) })),
          name
        )

        return await getContractQueries<Parsed>(document, name)
      }
    },
})

export const getListedContractQueriesQuery = selector({
  key: "getListedContractQueries",
  get: ({ get }) => {
    const { listedAll } = get(protocolQuery)
    const getContractQueries = get(getContractQueriesQuery)

    return async <Parsed>(fn: GetDocument, name: string) => {
      const document = alias(
        listedAll
          .filter((item) => fn(item))
          .map((item) => ({ name: item.token, ...fn(item) })),
        name
      )

      return await getContractQueries<Parsed>(document, name)
    }
  },
})

export const getContractQueriesQuery = selector({
  key: "getContractQueries",
  get: ({ get }) => {
    get(locationKeyState)
    const url = get(mantleURLQuery)

    return async <Parsed>(document: RequestDocument, name: string) => {
      try {
        const result = await request<Dictionary<ContractData | null> | null>(
          url + "?" + name,
          document
        )

        return result ? parseResults<Parsed>(result) : undefined
      } catch (error) {
        const result = (error as ClientError).response.data
        return result ? parseResults<Parsed>(result) : undefined
      }
    }
  },
})
