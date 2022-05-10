import { useParams, useRouteMatch } from "react-router-dom"
import { useGetVoted } from "../../data/gov/vote"
import { Poll } from "../../data/gov/poll"
import { Submit } from "../../components/Button"
import LinkButton from "../../components/LinkButton"

const VoteLink = ({ id, end_time, status }: Poll) => {
  const { url } = useRouteMatch()
  const params = useParams<{ id: string }>()
  const getVoted = useGetVoted()
  const voted = getVoted(id)

  const inactive = ["executed", "passed"].includes(status)

  const end = end_time * 1000 < Date.now()

  return params.id && !end ? (
    <Submit>
      <LinkButton to={url + "/vote"} disabled={voted || inactive}>
        {voted ? "Voted" : inactive ? "Inactive" : "Vote"}
      </LinkButton>
    </Submit>
  ) : null
}

export default VoteLink
