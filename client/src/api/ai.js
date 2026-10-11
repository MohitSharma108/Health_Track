import { useMutation, useQuery } from '@tanstack/react-query'
import api from '@/lib/api'

export function useWhatToEat() {
  return useMutation({
    mutationFn: (context) => api.post('/ai/eat-now', context),
  })
}

export function usePlanDay() {
  return useMutation({
    mutationFn: (context) => api.post('/ai/plan-day', context),
  })
}

export function useDailyAnalysis() {
  return useMutation({
    mutationFn: (data) => api.post('/ai/daily-analysis', data),
  })
}

export function useAiAssistant() {
  return useMutation({
    mutationFn: ({ message, history }) =>
      api.post('/ai/assistant', { message, history }),
  })
}
