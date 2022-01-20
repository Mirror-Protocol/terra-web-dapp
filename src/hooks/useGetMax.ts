import BigNumber from "bignumber.js"
import useFee from "./useFee"

export const useGetMax = () => {
  const fee = useFee()

  return (balance = "0") => {
    const balanceSafe = new BigNumber(balance).minus(1e6)
    const max = BigNumber.max(new BigNumber(balanceSafe).minus(fee.amount), 0)
    return max.toString()
  }
}

export default useGetMax
