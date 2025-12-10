import { useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

type Query = Record<string, string | string[]>

const parseQuery = (search: string): Query => {
  const params = new URLSearchParams(search)
  const query: Query = {}
  params.forEach((value, key) => {
    if (query[key]) {
      const existing = query[key]
      query[key] = Array.isArray(existing) ? [...existing, value] : [existing, value]
    } else {
      query[key] = value
    }
  })
  return query
}

export function useRouter() {
  const navigate = useNavigate()
  const location = useLocation()

  const query = useMemo(() => parseQuery(location.search), [location.search])

  return {
    pathname: location.pathname,
    asPath: location.pathname + location.search,
    query,
    push: (url: string) => navigate(url),
    replace: (url: string) => navigate(url, { replace: true }),
    back: () => navigate(-1),
  }
}

export default useRouter

