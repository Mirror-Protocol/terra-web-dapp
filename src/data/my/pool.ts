import { useQuery } from "react-query"
import { useLCDClient } from "@terra-money/wallet-provider"
import { gt, sum } from "../../libs/math"
import { StakingKey } from "../../hooks/contractKeys"
import { useProtocol } from "../contract/protocol"
import { useFindStaking } from "../contract/normalize"
import { useAddress, useNetwork } from "../../hooks"
import usePool from "../../forms/modules/usePool"
import useMirrorTerraswapPool from "../../forms/modules/useMirrorTerraswapPool"

const useMirrorTerraswapLpBalance = () => {
  const address = useAddress()
  const lcd = useLCDClient()
  const { mirrorTerraswap } = useNetwork()
  const { lpToken } = mirrorTerraswap

  return useQuery(["MirrorTerraswapLpBalance", address], async () => {
    const { balance } = await lcd.wasm.contractQuery<Balance>(lpToken, {
      balance: { address },
    })

    return balance
  })
}

export const useMyPool = () => {
  const { whitelist, listedAll, getIsDelisted, getToken } = useProtocol()

  const { contents: findStaking, isLoading } = useFindStaking()
  const getPool = usePool()
  const getMirrorTerraswapPool = useMirrorTerraswapPool()

  const { data: mirrorTerraswapLpBalance = "0" } = useMirrorTerraswapLpBalance()
  const mirrorToken = getToken("MIR")
  const mirrorItem = whitelist[mirrorToken]

  const mirrorTerraswapItem = {
    ...mirrorItem,
    migrationRequired: true,
    delisted: false,
    balance: mirrorTerraswapLpBalance,
    withdrawable: getMirrorTerraswapPool?.(mirrorTerraswapLpBalance).fromLP,
  }

  const dataSourceListed = listedAll
    .map((item: ListedItem) => {
      const { token } = item
      const balance = findStaking(StakingKey.LPSTAKABLE, token)
      const { fromLP } = getPool({ amount: balance, token })

      return {
        ...item,
        migrationRequired: false,
        delisted: getIsDelisted(token),
        balance,
        withdrawable: fromLP,
      }
    })
    .filter(({ balance }) => gt(balance, 0))

  const dataSource = gt(mirrorTerraswapLpBalance, 0)
    ? [mirrorTerraswapItem, ...dataSourceListed]
    : dataSourceListed

  const totalWithdrawableValue = sum(
    dataSource.map(({ withdrawable }) => withdrawable?.value ?? 0)
  )

  return { dataSource, totalWithdrawableValue, isLoading }
}
