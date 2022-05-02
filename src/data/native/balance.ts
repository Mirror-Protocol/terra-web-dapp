import { useNativeBalances } from "../contract/normalize"

export const useUusdBalance = () => {
  const nativeBalances = useNativeBalances()
  return nativeBalances["uusd"] ?? "0"
}
