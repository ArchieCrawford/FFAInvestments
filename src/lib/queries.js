import { useQuery } from '@tanstack/react-query'
import {
  getDashboard,
  getOrgBalanceHistory,
  getUnitPriceHistory,
  getLatestUnitPrice,
  getMemberAccountByEmail,
  getMemberTimelineByName,
  getCompleteMemberProfiles,
  getLatestSchwabSnapshot,
  getSchwabPositionsForDate,
  getLatestSchwabPositions,
  getMemberFeed,
  getMemberAccounts,
  getMembers,
  getCurrentMemberAccount,
} from './ffaApi'

export function useDashboard() {
  return useQuery({
    queryKey: ['dashboard'],
    queryFn: getDashboard,
  })
}

export function useOrgBalanceHistory() {
  return useQuery({
    queryKey: ['org_balance_history'],
    queryFn: getOrgBalanceHistory,
  })
}

export function useUnitPriceHistory() {
  return useQuery({
    queryKey: ['unit_price_history'],
    queryFn: getUnitPriceHistory,
  })
}

export function useLatestUnitPrice() {
  return useQuery({
    queryKey: ['latest_unit_price'],
    queryFn: getLatestUnitPrice,
  })
}

export function useMemberAccountByEmail(email) {
  return useQuery({
    queryKey: ['member_account', email],
    queryFn: () => getMemberAccountByEmail(email),
    enabled: !!email,
  })
}

export function useMemberTimelineByName(memberName) {
  return useQuery({
    queryKey: ['member_timeline', memberName],
    queryFn: () => getMemberTimelineByName(memberName),
    enabled: !!memberName,
  })
}

export function useCompleteMemberProfiles() {
  return useQuery({
    queryKey: ['members_with_accounts'],
    queryFn: getCompleteMemberProfiles,
  })
}

export function useLatestSchwabSnapshot() {
  return useQuery({
    queryKey: ['schwab_snapshot_latest'],
    queryFn: getLatestSchwabSnapshot,
  })
}

export function useSchwabPositionsForDate(dateStr) {
  return useQuery({
    queryKey: ['latest_schwab_positions'],
    queryFn: () => getSchwabPositionsForDate(dateStr),
    enabled: !!dateStr,
  })
}

export function useLatestSchwabPositions() {
  return useQuery({
    queryKey: ['latest_schwab_positions'],
    queryFn: getLatestSchwabPositions,
  })
}

export function useMemberFeed(limit = 20, cursor = null) {
  return useQuery({
    queryKey: ['member_feed', limit, cursor],
    queryFn: () => getMemberFeed({ limit, cursor }),
  })
}

export function useMemberAccounts() {
  return useQuery({
    queryKey: ['member_accounts'],
    queryFn: getMemberAccounts,
  })
}

export function useMembers() {
  return useQuery({
    queryKey: ['members'],
    queryFn: getMembers,
  })
}

export function useCurrentMemberAccount() {
  return useQuery({
    queryKey: ['current_member_account'],
    queryFn: getCurrentMemberAccount,
  })
}
