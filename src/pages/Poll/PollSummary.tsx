import { insertIf } from "../../libs/utils"
import { Poll } from "../../data/gov/poll"
import Dl from "../../components/Dl"
import PreLine from "../../components/PreLine"
import ExtLink from "../../components/ExtLink"
import Button from "../../components/Button"
import Pre from "../../components/Pre"
import Card from "../../components/Card"
import Modal, { useModal } from "../../containers/Modal"
import styles from "./PollSummary.module.scss"

const PollSummary = (props: Poll) => {
  const { description, link, admin_action, contents = [] } = props
  const modal = useModal()

  return (
    <section className={styles.wrapper}>
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
        ]}
        type="vertical"
      />

      {admin_action && (
        <>
          <Button size="xs" onClick={modal.open} className={styles.button}>
            View Raw logs
          </Button>
          <Modal {...modal}>
            <Card
              full
              title="Raw Message"
              center
              footer={
                <Button size="xs" onClick={modal.close}>
                  Hide
                </Button>
              }
              className={styles.modal}
            >
              <div className={styles.rawlog}>
                <Pre>{admin_action}</Pre>
              </div>
            </Card>
          </Modal>
        </>
      )}
    </section>
  )
}

export default PollSummary
