import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Sparkles, ArrowRight, ShieldCheck } from 'lucide-react'
import useAuthStore from '@/store/authStore'
import { Button, Card, Input } from '@/components/ui'
import { toast } from '@/components/layout/Toaster'

export default function AuthPage() {
  const navigate = useNavigate()
  const { login, register, isLoading, error, clearError } = useAuthStore()

  const [mode, setMode] = useState('login') // 'login' | 'register'
  const [showPassword, setShowPassword] = useState(false)
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    clearError()

    if (!form.email || !form.password) {
      toast('Please enter email and password', 'warning')
      return
    }

    if (mode === 'login') {
      const res = await login(form.email, form.password)
      if (res.success) {
        toast('Welcome back!')
        navigate('/diary')
      } else {
        toast(res.error || 'Login failed', 'error')
      }
    } else {
      const res = await register({
        name: form.name || 'User',
        email: form.email,
        password: form.password,
      })
      if (res.success) {
        toast('Account created! Welcome to Nourish')
        navigate('/diary')
      } else {
        toast(res.error || 'Registration failed', 'error')
      }
    }
  }

  const handleDemoLogin = () => {
    // Quick local demo bypass
    localStorage.setItem('nourish_token', 'demo-token')
    toast('Logged in as Guest')
    navigate('/diary')
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#fff5f5] to-[#f3f4f6] flex flex-col justify-center px-4 py-8">
      <div className="max-w-md w-full mx-auto">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-[#ff6b6b] rounded-2xl flex items-center justify-center text-3xl shadow-lg mx-auto mb-3">
            🥗
          </div>
          <h1 className="text-2xl font-black text-[#1a1a2e] tracking-tight">Nourish</h1>
          <p className="text-xs text-[#6b7280] mt-0.5">MyFitnessPal-grade AI Calorie & Macro Tracker</p>
        </div>

        {/* Auth Card */}
        <Card className="shadow-xl border-white/60">
          {/* Mode Switch Tabs */}
          <div className="flex bg-[#f3f4f6] p-1 rounded-xl mb-4">
            <button
              type="button"
              onClick={() => {
                setMode('login')
                clearError()
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                mode === 'login' ? 'bg-white text-[#1a1a2e] shadow-sm' : 'text-[#6b7280]'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register')
                clearError()
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                mode === 'register' ? 'bg-white text-[#1a1a2e] shadow-sm' : 'text-[#6b7280]'
              }`}
            >
              Create Account
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            {mode === 'register' && (
              <Input
                label="Full Name"
                placeholder="e.g. Mohit Sharma"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            )}

            <Input
              label="Email Address"
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
              autoFocus
            />

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-[#6b7280]">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full rounded-xl border border-[#e5e7eb] px-4 py-2.5 text-sm focus:outline-none focus:border-[#ff6b6b] focus:ring-1 focus:ring-[#ff6b6b] bg-white pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6b7280] hover:text-[#1a1a2e]"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="text-xs font-semibold text-red-500 bg-red-50 p-2.5 rounded-xl border border-red-200">
                {error}
              </div>
            )}

            <Button
              variant="primary"
              size="lg"
              type="submit"
              className="w-full font-bold shadow-md mt-2"
              loading={isLoading}
            >
              {mode === 'login' ? 'Sign In to Tracker' : 'Create Free Account'} <ArrowRight size={16} />
            </Button>
          </form>

          {/* Quick Demo Access */}
          <div className="mt-4 pt-3 border-t border-[#f3f4f6] text-center">
            <button
              onClick={handleDemoLogin}
              className="text-xs text-[#6b7280] hover:text-[#ff6b6b] font-semibold transition-colors"
            >
              ⚡ Continue as Guest (Offline Mode)
            </button>
          </div>
        </Card>

        <div className="flex items-center justify-center gap-2 mt-4 text-[11px] text-[#9ca3af]">
          <ShieldCheck size={14} /> 100% Free, Ad-Free & Offline Ready
        </div>
      </div>
    </div>
  )
}
