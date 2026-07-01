import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as svc from '../services/proposals'

export function useTemplates() {
  return useQuery(['proposals','templates'], svc.listTemplates)
}

export function useCreateTemplate() {
  const qc = useQueryClient()
  return useMutation((payload: { name: string; content: string }) => svc.createTemplate(payload), {
    onSuccess: () => qc.invalidateQueries(['proposals','templates'])
  })
}
