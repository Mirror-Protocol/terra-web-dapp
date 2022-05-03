import { atom, selector, useRecoilValue } from "recoil"
import networks, { defaultNetwork } from "../networks"

export const networkNameState = atom({
  key: "networkName",
  default: defaultNetwork.name,
})

export const useNetwork = () => {
  const name = useRecoilValue(networkNameState)
  return networks[name]
}

export const networkQuery = selector({
  key: "network",
  get: ({ get }) => {
    const name = get(networkNameState)
    return networks[name]
  },
})

export const mantleURLQuery = selector({
  key: "mantleURL",
  get: ({ get }) => {
    const { mantle } = get(networkQuery)
    return mantle
  },
})
