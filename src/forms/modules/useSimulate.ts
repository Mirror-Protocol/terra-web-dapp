import { useRecoilValue } from "recoil"
import { useEffect, useState } from "react"
import { equals } from "ramda"
import { div, gt } from "../../libs/math"
import { TradeType } from "../../types/Types"
import { pairSimulateQuery } from "../../data/contract/simulate"

interface Params {
  amount: string
  token: string
  pair: string
  reverse: boolean
  type: TradeType
}

interface Simulated {
  amount: string
  spread: string
  commission: string
  price: string
}

type Result =
  | { params: Params; simulated: Simulated }
  | { params: Params; error: Error }

export default (params: Params, isLimitOrder: boolean) => {
  const { amount, token, pair, reverse, type } = params
  const [results, setResults] = useState<Result[]>([])
  const [loading, setLoading] = useState(false)

  const valid = amount && gt(amount, 0) && token && pair && !isLimitOrder
  const simulate = useRecoilValue(pairSimulateQuery)

  useEffect(() => {
    const fn = async () => {
      const params = { amount, token, pair, reverse, type }

      try {
        setLoading(true)
        const result = await simulate(params)

        const simulatedAmount = !reverse
          ? result?.return_amount
          : result?.offer_amount

        const spread = result?.spread_amount
        const commission = result?.commission_amount

        const price = {
          [TradeType.BUY]: !reverse
            ? div(amount, simulatedAmount)
            : div(simulatedAmount, amount),
          [TradeType.SELL]: !reverse
            ? div(simulatedAmount, amount)
            : div(amount, simulatedAmount),
        }[type]

        if (simulatedAmount && spread && commission && price) {
          setResults((prev) => {
            const amount = simulatedAmount
            const simulated = { amount, spread, commission, price }
            return [...prev, { params, simulated }]
          })
        }
      } catch (error) {
        setResults((prev) => {
          return [...prev, { params, error: error as Error }]
        })
      }

      setLoading(false)
    }

    valid && fn()
  }, [valid, simulate, amount, token, pair, reverse, type])

  const result = results.find((result) => equals(result.params, params))

  return { simulated: undefined, error: undefined, ...result, loading }
}
