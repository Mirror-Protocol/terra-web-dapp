import { useRouteMatch } from "react-router-dom"
import { gt, sum } from "../../libs/math"
import { Poll } from "../../data/gov/poll"
import Card from "../../components/Card"
import { Gutter } from "../../components/Grid"
import FormFeedback from "../../components/FormFeedback"
import PollHeader from "./PollHeader"
import PollMeta from "./PollMeta"
import PollSummary from "./PollSummary"
import PollVotes from "./PollVotes"
import PollVoters from "./PollVoters"
import VoteLink from "./VoteLink"
import styles from "./PollDetails.module.scss"

const PollDetails = ({ poll }: { poll: Poll }) => {
  const { params } = useRouteMatch<{ id: string }>()
  const { admin_action } = poll
  const id = Number(params.id)

  const fromFeedBack =
    admin_action &&
    ("execute_migrations" in admin_action ||
    "authorize_claim" in admin_action ? (
      <FormFeedback type="warn">
        Migration poll is executable anytime after the poll’s quorum and
        threshold is reached
      </FormFeedback>
    ) : undefined)

  return !poll ? null : (
    <>
      {fromFeedBack}
      <Gutter>
        <Card>
          <PollHeader {...poll} titleClassName={styles.title} />
          <PollMeta {...poll} />
          <VoteLink {...poll} />
        </Card>
      </Gutter>

      <Gutter>
        <Card>
          <PollSummary {...poll} />
        </Card>
      </Gutter>

      <Gutter>
        <Card title="Vote Details">
          {!gt(getTotal(poll), 0) ? (
            <p className="empty">No votes found</p>
          ) : (
            <PollVotes {...poll} lg />
          )}
        </Card>
      </Gutter>

      <Gutter>
        <PollVoters id={id} />
      </Gutter>
    </>
  )
}

export default PollDetails

/* helpers */
const getTotal = (poll: Poll) =>
  sum([poll.yes_votes ?? 0, poll.no_votes ?? 0, poll.abstain_votes ?? 0])
