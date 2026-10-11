import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { User, Target, LogOut, Check, Sparkles } from 'lucide-react'
import { useProfile, useUpdateProfile } from '@/api/profile'
import useAuthStore from '@/store/authStore'
import { Button, Card, Input, SectionLabel } from '@/components/ui'
import { toast } from '@/components/layout/Toaster'

export default function SettingsPage() {
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  const { data: profile, isLoading } = useProfile()
  const updateProfileMutation = useUpdateProfile()

  const [form, setForm] = useState({
    name: user?.name || '',
    calorieGoal: 2000,
    proteinGoal: 140,
    carbsGoal: 250,
    fatGoal: 65,
    waterGoal: 2500,
    weight: 70,
    height: 175,
    dietPreference: 'vegetarian',
  })

  useEffect(() => {
    if (profile) {
      setForm({
        name: profile.name || user?.name || '',
        calorieGoal: profile.calorieGoal || 2000,
        proteinGoal: profile.proteinGoal || 140,
        carbsGoal: profile.carbsGoal || 250,
        fatGoal: profile.fatGoal || 65,
        waterGoal: profile.waterGoal || 2500,
        weight: profile.weight || 70,
        height: profile.height || 175,
        dietPreference: profile.dietPreference || 'vegetarian',
      })
    }
  }, [profile, user])

  const handleSave = async (e) => {
    e?.preventDefault()
    try {
      await updateProfileMutation.mutateAsync({
        ...form,
        calorieGoal: Number(form.calorieGoal),
        proteinGoal: Number(form.proteinGoal),
        carbsGoal: Number(form.carbsGoal),
        fatGoal: Number(form.fatGoal),
        waterGoal: Number(form.waterGoal),
      })
      toast('Profile & goals saved')
    } catch (e) {
      toast(e.message, 'error')
    }
  }

  const handleLogout = () => {
    logout()
    toast('Logged out successfully')
    navigate('/auth')
  }

  return (
    <div className="pt-4 px-4 pb-16">
      <div className="mb-4">
        <h1 className="text-xl font-black text-[#1a1a2e]">My Profile & Goals</h1>
        <p className="text-xs text-[#6b7280]">Adjust calorie targets, macro ratios & preferences</p>
      </div>

      <form onSubmit={handleSave} className="flex flex-col gap-4">
        {/* User Identity */}
        <Card>
          <SectionLabel>Account</SectionLabel>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-full bg-[#ff6b6b] text-white flex items-center justify-center text-lg font-black">
              {(form.name || user?.email || 'N')[0].toUpperCase()}
            </div>
            <div>
              <h3 className="font-bold text-sm text-[#1a1a2e]">{form.name || 'Nourish User'}</h3>
              <p className="text-xs text-[#6b7280]">{user?.email || 'user@nourish.local'}</p>
            </div>
          </div>
          <Input
            label="Full Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </Card>

        {/* Nutritional Goals */}
        <Card>
          <SectionLabel>Daily Nutritional Targets</SectionLabel>
          <div className="mb-3">
            <Input
              label="Daily Calories (kcal)"
              type="number"
              value={form.calorieGoal}
              onChange={(e) => setForm({ ...form, calorieGoal: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-3 gap-2 mb-3">
            <Input
              label="Protein (g)"
              type="number"
              value={form.proteinGoal}
              onChange={(e) => setForm({ ...form, proteinGoal: e.target.value })}
            />
            <Input
              label="Carbs (g)"
              type="number"
              value={form.carbsGoal}
              onChange={(e) => setForm({ ...form, carbsGoal: e.target.value })}
            />
            <Input
              label="Fat (g)"
              type="number"
              value={form.fatGoal}
              onChange={(e) => setForm({ ...form, fatGoal: e.target.value })}
            />
          </div>

          <Input
            label="Water Goal (ml)"
            type="number"
            value={form.waterGoal}
            onChange={(e) => setForm({ ...form, waterGoal: e.target.value })}
          />
        </Card>

        {/* Diet & Body */}
        <Card>
          <SectionLabel>Diet Preference & Stats</SectionLabel>
          <div className="mb-3">
            <label className="text-xs font-semibold text-[#6b7280] block mb-1">Diet Type</label>
            <select
              value={form.dietPreference}
              onChange={(e) => setForm({ ...form, dietPreference: e.target.value })}
              className="w-full rounded-xl border border-[#e5e7eb] px-3 py-2.5 text-sm bg-white focus:outline-none focus:border-[#ff6b6b]"
            >
              <option value="vegetarian">Vegetarian (Indian)</option>
              <option value="eggetarian">Eggetarian</option>
              <option value="non_vegetarian">Non-Vegetarian</option>
              <option value="vegan">Vegan</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Input
              label="Current Weight (kg)"
              type="number"
              step="0.1"
              value={form.weight}
              onChange={(e) => setForm({ ...form, weight: e.target.value })}
            />
            <Input
              label="Height (cm)"
              type="number"
              value={form.height}
              onChange={(e) => setForm({ ...form, height: e.target.value })}
            />
          </div>
        </Card>

        <Button
          variant="primary"
          size="lg"
          type="submit"
          className="w-full font-bold shadow-md"
          loading={updateProfileMutation.isPending}
        >
          <Check size={18} /> Save Settings
        </Button>

        <Button
          variant="outline"
          size="md"
          type="button"
          className="w-full font-bold text-red-500 hover:text-red-600 hover:bg-red-50 border-red-200"
          onClick={handleLogout}
        >
          <LogOut size={16} /> Sign Out
        </Button>
      </form>
    </div>
  )
}
