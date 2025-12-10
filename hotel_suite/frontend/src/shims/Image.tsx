import type { ImgHTMLAttributes } from 'react'

type Props = ImgHTMLAttributes<HTMLImageElement>

export default function Image(props: Props) {
  return <img {...props} />
}

