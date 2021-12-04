import { AnchorHTMLAttributes } from "react"

export type Props = AnchorHTMLAttributes<HTMLAnchorElement>
const ExtLink = ({ children, ...attrs }: Props) => {
  if (!attrs.href) return null

  /* validate */
  const url = new URL(attrs.href)
  if (!(url.protocol === "http:" || url.protocol === "https:")) return null

  return (
    <a {...attrs} target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  )
}

export default ExtLink
