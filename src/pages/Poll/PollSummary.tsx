import { insertIf } from "../../libs/utils"
import { Poll } from "../../data/gov/poll"
import Dl from "../../components/Dl"
import PreLine from "../../components/PreLine"
import ExtLink from "../../components/ExtLink"
import Modal, { useModal } from "../../containers/Modal"
import Button from "../../components/Button"
import Pre from "../../components/Pre"
import Card from "../../components/Card"
import styles from "./PollSummary.module.scss"

const PollSummary = (props: Poll) => {
  const { description, link, admin_action, contents = [] } = props
  const modal = useModal()

  return (
    <Dl
      list={[
        {
          title: "Description",
          content: <PreLine>{description}</PreLine>,
        },
        ...insertIf(link, {
          title: "Link",
          content: <ExtLink href={link}>{link}</ExtLink>,
        }),
        ...contents,
        {
          content: admin_action && (
            <>
              <Button size="xs" onClick={modal.open}>
                View Raw logs
              </Button>
              <Modal {...modal}>
                <Card
                  title="Migration Message"
                  center
                  footer={
                    <Button size="xs" onClick={modal.close}>
                      Hide
                    </Button>
                  }
                  className={styles.rawlog}
                >
                  <section className={styles.log}>
                    <Pre>{admin_action}</Pre>
                  </section>
                </Card>
              </Modal>
            </>
          ),
        },
      ]}
      type="vertical"
    />
  )
}

export default PollSummary
