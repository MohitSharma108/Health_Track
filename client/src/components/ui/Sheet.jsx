import { useState, useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/components/ui'

/**
 * Mobile-native bottom sheet (slide up modal)
 * Supports drag-to-close
 */
export default function Sheet({ open, onClose, title, children, className }) {
  const [isDragging, setIsDragging] = useState(false)
  const startY = useRef(0)
  const currentY = useRef(0)
  const sheetRef = useRef(null)

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [open])

  const handleTouchStart = (e) => {
    startY.current = e.touches[0].clientY
    setIsDragging(true)
  }

  const handleTouchMove = (e) => {
    if (!isDragging) return
    currentY.current = e.touches[0].clientY - startY.current
    if (currentY.current > 0 && sheetRef.current) {
      sheetRef.current.style.transform = `translateY(${currentY.current}px)`
    }
  }

  const handleTouchEnd = () => {
    setIsDragging(false)
    if (currentY.current > 120) {
      onClose()
    } else if (sheetRef.current) {
      sheetRef.current.style.transform = ''
    }
    currentY.current = 0
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Sheet */}
      <div
        ref={sheetRef}
        className={cn(
          'relative z-10 bg-white rounded-t-3xl shadow-2xl max-h-[92dvh] flex flex-col transition-transform',
          className
        )}
        style={{ willChange: 'transform' }}
      >
        {/* Handle */}
        <div
          className="flex justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div className="w-10 h-1 bg-[#e5e7eb] rounded-full" />
        </div>

        {/* Header */}
        {title && (
          <div className="flex items-center justify-between px-5 pb-3 border-b border-[#f3f4f6]">
            <h3 className="font-bold text-lg text-[#1a1a2e]">{title}</h3>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#f3f4f6]">
              <X size={18} />
            </button>
          </div>
        )}

        {/* Content */}
        <div className="overflow-y-auto overscroll-contain flex-1 px-5 py-4">
          {children}
        </div>
      </div>
    </div>
  )
}
