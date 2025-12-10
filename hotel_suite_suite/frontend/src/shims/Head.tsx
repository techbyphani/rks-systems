import { Helmet } from 'react-helmet-async'
import type { ReactNode } from 'react'

interface HeadProps {
  children?: ReactNode
}

export default function Head({ children }: HeadProps) {
  return <Helmet>{children}</Helmet>
}

