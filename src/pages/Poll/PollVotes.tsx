import classNames from "classnames"
import { div, gt, sum, times } from "../../libs/math"
import { formatAsset } from "../../libs/parse"
import { percent } from "../../libs/num"
import { useGovConfig } from "../../data/gov/config"
import { useGovState } from "../../data/gov/state"
import { getConfig } from "../../data/gov/parse"
import { AdminAction, Poll } from "../../data/gov/poll"
import { useTotalStaked } from "../../data/gov/store"
import Progress from "../../components/Progress"
import styles from "./PollVotes.module.scss"

interface Item {
  label: string
  value: string
  amount: string
  color: string
}

interface VotesProps {
  list: Item[]
}

const Votes = ({ list }: VotesProps) => (
  <div className={styles.wrapper}>
    <section className={styles.votes}>
      {list.map(({ label, value, amount, color }) => (
        <span className={classNames(styles.label, color)} key={label}>
          <strong className={styles.answer}>{label}</strong>
          <span>{percent(value)}</span>
          <small>{formatAsset(amount, "MIR", { integer: true })}</small>
        </span>
      ))}
    </section>
  </div>
)

interface Props extends Poll {
  lg?: boolean
}

const PollVotes = ({ lg, ...props }: Props) => {
  const { yes_votes = "0", no_votes = "0", abstain_votes = "0" } = props
  const { staked_amount, total_balance_at_end_poll, admin_action } = props

  const state = useGovState()
  const config = useGovConfig()
  const totalStaked = useTotalStaked()

  const safeTotal = total_balance_at_end_poll ?? staked_amount ?? totalStaked

  const votes = {
    yes: yes_votes,
    no: no_votes,
    abstain: abstain_votes,
    total: safeTotal,
  }

  const parsed = config && state && parseVotes(votes, config, admin_action)

  return !parsed ? null : (
    <>
      <Progress {...parsed} noLabel />
      {lg && <Votes list={parsed.data} />}
    </>
  )
}

export default PollVotes

/* helpers */
export const parseVotes = (
  votes: { yes: string; no: string; abstain: string; total: string },
  { ...config }: GovConfig,
  admin_action?: AdminAction
) => {
  const { total } = votes
  const yes = div(votes["yes"], total)
  const no = div(votes["no"], total)
  const abstain = div(votes["abstain"], total)
  const voted = sum([yes, no, abstain])
  const pollConfig = getConfig(config, admin_action)

  const quorum = pollConfig?.quorum || "0"
  const threshold = times(pollConfig?.threshold, voted)

  return {
    voted,
    quorum,
    axis: !gt(voted, quorum)
      ? [{ x: quorum, label: `Quorum ${percent(quorum, -1)}` }]
      : [{ x: threshold, label: "Threshold" }],
    data: [
      {
        label: "yes",
        value: yes,
        amount: votes["yes"],
        color: "blue" as const,
      },
      {
        label: "no",
        value: no,
        amount: votes["no"],
        color: "red" as const,
      },
      {
        label: "abstain",
        value: abstain,
        amount: votes["abstain"],
        color: "gray" as const,
      },
    ],
  }
}
