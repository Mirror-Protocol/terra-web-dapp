import { FC } from "react"
import styles from "./Delisted.module.scss"

const Delisted: FC = ({ children = "Delisted" }) => (
  <div className={styles.component}>{children}</div>
)

export default Delisted
