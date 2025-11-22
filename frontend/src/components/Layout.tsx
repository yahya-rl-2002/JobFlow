import { ReactNode } from 'react'
import Sidebar from './Sidebar'

interface LayoutProps {
  children: ReactNode
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--bg-light)' }}>
      <Sidebar />
      <div style={{
        flex: 1,
        marginLeft: '280px',
        width: 'calc(100% - 280px)',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <main style={{ flex: 1, padding: '40px' }}>
          {children}
        </main>
      </div>
    </div>
  )
}
