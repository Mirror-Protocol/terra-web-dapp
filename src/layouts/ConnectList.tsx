import { useWallet } from "@terra-money/wallet-provider"
import { ReactNode } from "react"
import ExtLink from "../components/ExtLink"
import styles from "./ConnectList.module.scss"

interface Button {
  label: string
  src?: string
  image?: ReactNode
  onClick?: () => void
  href?: string
}

const size = { width: 24, height: 24 }
const ConnectList = () => {
  const { availableConnections, availableInstallations, connect } = useWallet()

  const buttons = ([] as Button[])
    .concat(
      availableConnections?.map(({ type, identifier, name, icon }) => ({
        image: <img src={icon} alt="" {...size} />,
        label: name,
        onClick: () => connect(type, identifier),
      }))
    )
    .concat(
      availableInstallations.map(({ name, icon, url }) => ({
        label: `Install ${name}`,
        src: icon,
        href: url,
      }))
    )

  return (
    <article className={styles.component}>
      <h1 className={styles.title}>Connect to a wallet</h1>
      <section>
        {Object.entries(buttons).map(
          ([key, { label, src, image, onClick, href }]) => {
            if (onClick) {
              return (
                <button className={styles.button} onClick={onClick} key={key}>
                  {label}
                  {image}
                </button>
              )
            } else {
              return (
                <ExtLink className={styles.button} href={href} key={key}>
                  {label}
                  <img src={src} {...size} alt="" />
                </ExtLink>
              )
            }
          }
        )}
      </section>
    </article>
  )
}

export default ConnectList
