import { NavLink } from 'react-router-dom'
import { Home, PlusCircle, Sparkles, BarChart2, User } from 'lucide-react'
import { cn } from '@/components/ui'

const NAV_ITEMS = [
  { to: '/diary',    icon: Home,       label: 'Diary'    },
  { to: '/log',      icon: PlusCircle, label: 'Log'      },
  { to: '/ai',       icon: Sparkles,   label: 'AI Coach' },
  { to: '/progress', icon: BarChart2,  label: 'Progress' },
  { to: '/settings', icon: User,       label: 'Me'       },
]

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-t border-[#e5e7eb] safe-area-bottom">
      <div className="max-w-lg mx-auto flex items-stretch h-16">
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center justify-center flex-1 gap-0.5 text-[10px] font-semibold transition-colors',
                isActive ? 'text-[#ff6b6b]' : 'text-[#6b7280] hover:text-[#1a1a2e]'
              )
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={22} strokeWidth={isActive ? 2.5 : 1.8} />
                {label}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
