import { insertIf } from "../../libs/utils"
import { Poll } from "../../data/gov/poll"
import { parseExecuteData } from "../../data/gov/parse"
import Dl from "../../components/Dl"
import PreLine from "../../components/PreLine"
import ExtLink from "../../components/ExtLink"
import Button from "../../components/Button"
import Pre from "../../components/Pre"
import Card from "../../components/Card"
import Modal, { useModal } from "../../containers/Modal"
import styles from "./PollSummary.module.scss"

const PollSummary = (props: Poll) => {
  const { description, link, admin_action, execute_data, contents = [] } = props
  const modal = useModal()

  const content = admin_action
    ? "authorize_claim" in admin_action
      ? [
          {
            title: "address to authorize admin keys to",
            content: admin_action.authorize_claim.authorized_addr,
          },
        ]
      : "execute_migrations" in admin_action
      ? admin_action.execute_migrations.migrations.map(([address]) => ({
          title: "contract",
          content: address,
        }))
      : []
    : []

  const executeData = execute_data && parseExecuteData(execute_data)

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
          ...content,
          ...contents,
        ]}
        type="vertical"
      />

      {(admin_action || executeData) && (
        <>
          <Button size="xs" onClick={modal.open} className={styles.button}>
            View Raw Message
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
              <div className={styles.message}>
                <Pre>{admin_action || executeData}</Pre>
              </div>
            </Card>
          </Modal>
        </>
      )}
    </section>
  )
}

export default PollSummary
