import { useGetVoted } from "../../data/gov/vote"
import { Poll } from "../../data/gov/poll"
import { isEmphasizedPoll } from "./pollHelpers"
import usePollTimeText from "./usePollTimeText"
import PollHeader from "./PollHeader"
import PollVotes from "./PollVotes"
import styles from "./PollItem.module.scss"

const PollItem = (poll: Poll) => {
  const pollTimeText = usePollTimeText(poll)
  const getVoted = useGetVoted()
  const { admin_action } = poll

  return !poll ? null : (
    <article className={styles.component}>
      <section className={styles.main}>
        <PollHeader {...poll} titleClassName={styles.title} />
        <PollVotes {...poll} />
      </section>

      <footer className={styles.footer}>
        <p>
          <strong>{pollTimeText.label}: </strong>
          {pollTimeText.text}
          {isEmphasizedPoll(poll) && ` (${pollTimeText.toNow})`}
        </p>

        {getVoted(poll.id) && "Voted"}
      </footer>

      {admin_action && (
        <section className={styles.note}>
          <p>Executed when quorum and threshold are met</p>
        </section>
      )}
    </article>
  )
}

export default PollItem
