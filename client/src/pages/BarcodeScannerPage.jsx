import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Barcode, Search, Check, AlertCircle } from 'lucide-react'
import { useBarcodeSearch } from '@/api/foods'
import { Button, Card, Input, Spinner, SectionLabel } from '@/components/ui'
import { NutritionSummaryCard } from '@/components/ui/MacroRing'
import { toast } from '@/components/layout/Toaster'
import useDiaryStore from '@/store/diaryStore'

export default function BarcodeScannerPage() {
  const navigate = useNavigate()
  const { ensureDraft, addDraftItem } = useDiaryStore()
  const [barcodeInput, setBarcodeInput] = useState('')
  const [activeBarcode, setActiveBarcode] = useState('')

  const { data: product, isLoading, error } = useBarcodeSearch(activeBarcode)

  const handleLookup = (e) => {
    e?.preventDefault()
    if (!barcodeInput.trim()) return
    setActiveBarcode(barcodeInput.trim())
  }

  const handleAddProduct = () => {
    if (!product) return
    ensureDraft()
    navigate(`/log/food/${product.barcode}`, {
      state: {
        food: {
          id: product.barcode,
          name: product.name,
          brand: product.brand,
          per100: product.per100,
          serving: product.serving,
        },
      },
    })
  }

  return (
    <div className="pt-4 px-4 pb-12">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={() => navigate(-1)}
          className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-white transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-lg font-black text-[#1a1a2e]">Barcode Scanner</h1>
          <p className="text-xs text-[#6b7280]">Powered by Open Food Facts (Free, 3M+ items)</p>
        </div>
      </div>

      {/* Barcode Search Form */}
      <Card className="mb-4">
        <SectionLabel>Enter Barcode Number</SectionLabel>
        <form onSubmit={handleLookup} className="flex gap-2">
          <Input
            placeholder="e.g. 8901030950391 or 012000000133"
            value={barcodeInput}
            onChange={(e) => setBarcodeInput(e.target.value)}
            className="flex-1"
            autoFocus
          />
          <Button variant="primary" size="md" type="submit" disabled={!barcodeInput.trim()}>
            <Search size={16} /> Look up
          </Button>
        </form>

        {/* Quick Sample Barcodes */}
        <div className="flex items-center gap-2 mt-3 flex-wrap">
          <span className="text-xs text-[#6b7280]">Try samples:</span>
          {[
            { label: 'Maggi', code: '8901058863617' },
            { label: 'Amul Milk', code: '8901262010054' },
            { label: 'Nutella', code: '3017620422003' },
          ].map((sample) => (
            <button
              key={sample.code}
              type="button"
              onClick={() => {
                setBarcodeInput(sample.code)
                setActiveBarcode(sample.code)
              }}
              className="text-xs text-[#ff6b6b] bg-[#fff0f0] px-2.5 py-1 rounded-lg font-semibold hover:bg-[#ffe5e5] transition-colors"
            >
              {sample.label}
            </button>
          ))}
        </div>
      </Card>

      {/* Loading state */}
      {isLoading && (
        <Card className="text-center py-10">
          <Spinner size={32} className="mx-auto mb-3" />
          <p className="text-sm font-bold text-[#1a1a2e]">Searching Open Food Facts Database...</p>
          <p className="text-xs text-[#6b7280] mt-1">Checking worldwide nutritional records</p>
        </Card>
      )}

      {/* Error state */}
      {error && (
        <Card className="border-red-200 bg-red-50 text-red-700 py-6 text-center">
          <AlertCircle size={32} className="mx-auto mb-2 text-red-500" />
          <h3 className="font-bold text-sm">Product Not Found</h3>
          <p className="text-xs text-red-600 mt-1 max-w-xs mx-auto">
            We couldn't find a product with barcode "{activeBarcode}". You can add it manually using "Add Ingredient" in Review Meal.
          </p>
        </Card>
      )}

      {/* Product Result */}
      {product && (
        <div className="flex flex-col gap-4">
          <Card>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-2xl bg-[#fff0f0] flex items-center justify-center text-2xl flex-shrink-0">
                📦
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-base text-[#1a1a2e] leading-snug">{product.name}</h3>
                {product.brand && <p className="text-xs text-[#6b7280]">{product.brand}</p>}
                <p className="text-xs font-semibold text-[#ff6b6b] mt-0.5">
                  Serving: {product.serving.qty} {product.serving.unit}
                </p>
              </div>
            </div>

            <SectionLabel>Nutrition per 100g</SectionLabel>
            <NutritionSummaryCard
              macros={product.per100}
              goals={{ cal: 2000, p: 140, c: 250, fat: 65 }}
              showRemaining={false}
            />
          </Card>

          <Button
            variant="primary"
            size="lg"
            className="w-full shadow-lg font-bold text-base py-3.5"
            onClick={handleAddProduct}
          >
            <Check size={18} /> Customize Portion & Add to Meal
          </Button>
        </div>
      )}
    </div>
  )
}
