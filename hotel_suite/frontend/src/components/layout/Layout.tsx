import { ReactNode } from 'react'
import { Layout as AntLayout } from 'antd'
import Header from './Header'
import Footer from './Footer'

const { Content } = AntLayout

interface LayoutProps {
  children: ReactNode
}

export default function Layout({ children }: LayoutProps) {
  return (
    <AntLayout style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header />
      <Content style={{ flex: 1 }}>
        {children}
      </Content>
      <Footer />
    </AntLayout>
  )
}
