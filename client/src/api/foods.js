import { useQuery, useMutation } from '@tanstack/react-query'
import api from '@/lib/api'

export function useFoodSearch(q) {
  return useQuery({
    queryKey: ['foods', 'search', q],
    queryFn: () => api.get(`/foods/search?q=${encodeURIComponent(q)}`),
    enabled: !!q && q.length > 1,
    staleTime: 120_000,
  })
}

export function useBarcodeSearch(barcode) {
  return useQuery({
    queryKey: ['foods', 'barcode', barcode],
    queryFn: () =>
      fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`)
        .then((r) => r.json())
        .then((d) => {
          if (d.status !== 1) throw new Error('Product not found')
          const p = d.product
          const n = p.nutriments || {}
          return {
            name: p.product_name || p.brands || 'Unknown product',
            brand: p.brands || '',
            barcode,
            per100: {
              cal: Math.round(n['energy-kcal_100g'] || 0),
              p:   Math.round((n.proteins_100g || 0) * 10) / 10,
              c:   Math.round((n.carbohydrates_100g || 0) * 10) / 10,
              fat: Math.round((n.fat_100g || 0) * 10) / 10,
              fib: Math.round((n.fiber_100g || 0) * 10) / 10,
              sod: Math.round(n.sodium_100g * 1000 || 0),
            },
            serving: {
              qty: p.serving_size ? parseFloat(p.serving_size) || 100 : 100,
              unit: 'g',
              grams: p.serving_size ? parseFloat(p.serving_size) || 100 : 100,
            },
          }
        }),
    enabled: !!barcode && barcode.length > 5,
    retry: false,
  })
}

export function useAiEstimate() {
  return useMutation({
    mutationFn: (description) =>
      api.post('/ai/estimate-macros', { description }),
  })
}
