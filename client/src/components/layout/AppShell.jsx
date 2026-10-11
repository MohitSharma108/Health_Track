import { Outlet } from 'react-router-dom'
import BottomNav from './BottomNav'
import { Toaster } from './Toaster'

export default function AppShell() {
  return (
    <div className="min-h-dvh bg-[#f3f4f6]">
      <main className="max-w-lg mx-auto pb-20">
        <Outlet />
      </main>
      <BottomNav />
      <Toaster />
    </div>
  )
}
