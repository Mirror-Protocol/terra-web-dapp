import { ConnectType, useWallet } from "@terra-money/wallet-provider"
import { ReactNode } from "react"
import { ReactComponent as Terra } from "../styles/images/Terra.svg"
import styles from "./ConnectList.module.scss"

const size = { width: 24, height: 24 }

const ConnectList = () => {
  const { availableConnections, availableInstallTypes, connect, install } =
    useWallet()

  type Button = { label: string; image: ReactNode; onClick: () => void }
  const buttons = ([] as Button[])
    .concat(
      availableInstallTypes.includes(ConnectType.EXTENSION)
        ? {
            label: "Terra Station Extension",
            image: <Terra {...size} />,
            onClick: () => install(ConnectType.EXTENSION),
          }
        : []
    )
    .concat(
      availableConnections?.map(({ type, identifier, name, icon }) => ({
        image: <img src={icon} alt="" {...size} />,
        label: name,
        onClick: () => connect(type, identifier),
      }))
    )

  return (
    <article className={styles.component}>
      <h1 className={styles.title}>Connect to a wallet</h1>
      <section>
        {Object.entries(buttons).map(([key, { label, image, onClick }]) => (
          <button className={styles.button} onClick={onClick} key={key}>
            {label}
            {image}
          </button>
        ))}
      </section>
    </article>
  )
}

export default ConnectList
