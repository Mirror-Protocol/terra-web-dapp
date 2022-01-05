import { useEffect } from "react"
import { useHistory, useLocation } from "react-router-dom"
import useHash from "../../libs/useHash"
import Page from "../../components/Page"
import { getPath, MenuKey } from "../../routes"
import StakeForm from "../../forms/StakeForm"
import { StakeType } from "../../types/Types"

const Stake = () => {
  const { hash: type } = useHash<StakeType>()
  const { state } = useLocation<{ token: string }>()
  const token = state?.token

  const { push } = useHistory()

  useEffect(() => {
    if (!token) push(getPath(MenuKey.MY))
  }, [push, token])

  return <Page>{type && <StakeForm type={type} token={token} />}</Page>
}

export default Stake
