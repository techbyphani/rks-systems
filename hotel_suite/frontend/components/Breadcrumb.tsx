import { useRouter } from 'next/router'
import { Breadcrumb as AntBreadcrumb } from 'antd'

interface BreadcrumbProps {
  items: { label: string; href: string }[]
}

export default function Breadcrumb({ items }: BreadcrumbProps) {
  const router = useRouter()
  
  const breadcrumbItems = items.map((item, idx) => ({
    title: idx === items.length - 1 ? (
      <span>{item.label}</span>
    ) : (
      <a onClick={() => router.push(item.href)} style={{ cursor: 'pointer' }}>
        {item.label}
      </a>
    ),
  }))
  
  return <AntBreadcrumb items={breadcrumbItems} style={{ marginBottom: '16px' }} />
}
