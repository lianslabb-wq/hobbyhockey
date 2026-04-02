import { useEffect } from 'react'

export function usePageMeta(title, description) {
  useEffect(() => {
    const prev = document.title
    document.title = title
    const meta = document.querySelector('meta[name="description"]')
    const prevDesc = meta?.getAttribute('content')
    if (meta && description) meta.setAttribute('content', description)
    return () => {
      document.title = prev
      if (meta && prevDesc) meta.setAttribute('content', prevDesc)
    }
  }, [title, description])
}
