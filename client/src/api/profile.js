import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'

export function useProfile() {
  return useQuery({
    queryKey: ['profile'],
    queryFn: () => api.get('/profile'),
    staleTime: 60_000,
  })
}

export function useUpdateProfile() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data) => api.put('/profile', data),
    onSuccess: () => qc.invalidateQueries(['profile']),
  })
}
