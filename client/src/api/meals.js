import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'

export const mealKeys = {
  all: ['meals'],
  byDate: (date) => ['meals', date],
}

export function useMealsByDate(date) {
  return useQuery({
    queryKey: mealKeys.byDate(date),
    queryFn: () => api.get(`/meals?date=${date}`),
    enabled: !!date,
    staleTime: 30_000,
    select: (data) => {
      const meals = Array.isArray(data?.meals) ? data.meals : Array.isArray(data) ? data : []
      return meals
    },
  })
}

export function useAddMeal() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (meal) => api.post('/meals', meal),
    onSuccess: (_, vars) => {
      qc.invalidateQueries(mealKeys.byDate(vars.date))
      qc.invalidateQueries(mealKeys.all)
    },
  })
}

export function useUpdateMeal() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...body }) => api.put(`/meals/${id}`, body),
    onSuccess: () => qc.invalidateQueries(mealKeys.all),
  })
}

export function useDeleteMeal() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id) => api.delete(`/meals/${id}`),
    onSuccess: () => qc.invalidateQueries(mealKeys.all),
  })
}
