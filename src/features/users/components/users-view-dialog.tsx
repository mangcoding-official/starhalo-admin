"use client"

import { useMemo } from 'react'
import { format } from 'date-fns'
import {
  CartesianGrid,
  Line,
  LineChart,
  PolarAngleAxis,
  RadialBar,
  RadialBarChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { DisplayField } from './users-view-display-field.tsx'
import { type User } from '../data/schema'
import { useUserDetailQuery } from '../hooks/use-user-detail-query'

type UsersViewDialogProps = {
  currentRow?: User | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

type RawProfile = {
  target_ml?: number | null
  default_target_ml?: number | null
  color?: string | null
}

type RawDailyAchievement = {
  id?: number | string | null
  achievement_date?: string | null
  total_intake_ml?: number | null
  target_ml_used?: number | null
  success_percentage?: number | null
  is_target_met?: boolean | null
  created_at?: string | null
  updated_at?: string | null
}

type RawIntakeLog = {
  daily_achievement_id?: number | string | null
  intake_volume_ml?: number | null
  client_time?: string | null
  created_at?: string | null
}

type DrinkHistoryRow = {
  id: string
  date: Date
  total: number
  target: number
  success: boolean
  percentage: number | null
}

const HOURS_IN_DAY = 24

function parseNullableDate(value?: string | null) {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

export function UsersViewDialog({ currentRow, open, onOpenChange }: UsersViewDialogProps) {
  const userId = currentRow?.id ?? null
  const { data, isLoading, isFetching, error } = useUserDetailQuery(userId, open)

  const detail = data

  const emailVerified =
    detail?.emailVerifiedAt && !Number.isNaN(detail.emailVerifiedAt.getTime())
      ? format(detail.emailVerifiedAt, 'dd MMM yyyy HH:mm')
      : detail?.emailVerifiedAt === null
        ? 'Not verified'
        : '-'

  const isPending = isLoading || isFetching

  const profile = detail?.profile
  const stats = detail?.stats

  const hydrationOverview = useMemo(() => {
    if (!detail?.raw) {
      return null
    }

    const raw = detail.raw as {
      profile?: RawProfile | null
      daily_achievements?: RawDailyAchievement[] | null
      intake_drink_logs?: RawIntakeLog[] | null
    }

    const achievements =
      raw.daily_achievements?.filter(
        (item): item is RawDailyAchievement => Boolean(item)
      ) ?? []

    if (!achievements.length) {
      return null
    }

    const [latestAchievement] = [...achievements].sort((a, b) => {
      const aDate =
        parseNullableDate(a.achievement_date) ??
        parseNullableDate(a.updated_at) ??
        parseNullableDate(a.created_at)
      const bDate =
        parseNullableDate(b.achievement_date) ??
        parseNullableDate(b.updated_at) ??
        parseNullableDate(b.created_at)
      return (bDate?.getTime() ?? 0) - (aDate?.getTime() ?? 0)
    })

    if (!latestAchievement) {
      return null
    }

    const target =
      // latestAchievement.target_ml_used ??
      raw.profile?.target_ml ??
      // raw.profile?.default_target_ml ??
      0
    const total = latestAchievement.total_intake_ml ?? 0
    const percentage = target > 0 ? Math.min(total / target, 1) : 0
    const accentColor = '#6BC691'

    const logs =
      raw.intake_drink_logs?.filter((log) => {
        if (!log) return false
        if (latestAchievement.id === undefined || latestAchievement.id === null) return true
        return String(log.daily_achievement_id ?? '') === String(latestAchievement.id ?? '')
      }) ?? []

    const hourlyTotals = Array.from({ length: HOURS_IN_DAY }, () => 0)

    logs.forEach((log) => {
      const timestamp =
        parseNullableDate(log.client_time) ??
        parseNullableDate(log.created_at)
      if (!timestamp) return
      const hour = timestamp.getHours()
      if (Number.isNaN(hour)) return
      const volume = log.intake_volume_ml ?? 0
      hourlyTotals[hour] += volume
    })

    const lineData = hourlyTotals.map((volume, hour) => ({
      hour,
      label: hour.toString().padStart(2, '0'),
      volume,
    }))

    if (lineData.every((point) => point.volume === 0) && total > 0) {
      lineData[Math.min(12, lineData.length - 1)].volume = total
    }

    const maxVolume = lineData.reduce(
      (max, item) => Math.max(max, item.volume),
      0
    )
    const yAxisCandidate = Math.max(maxVolume, total, target)
    const yMax = Math.max(100, Math.ceil((yAxisCandidate || 100) / 100) * 100)

    const date =
      parseNullableDate(latestAchievement.achievement_date) ??
      parseNullableDate(latestAchievement.updated_at) ??
      parseNullableDate(latestAchievement.created_at)

    return {
      total,
      target,
      percentage,
      radialValue: Math.round(Math.min(percentage, 1) * 100),
      lineData,
      yMax,
      date,
      isTargetMet: Boolean(latestAchievement.is_target_met),
      color: accentColor,
    }
  }, [detail?.raw])

  const drinkHistory = useMemo<DrinkHistoryRow[]>(() => {
    if (!detail?.raw) {
      return []
    }

    const raw = detail.raw as {
      profile?: RawProfile | null
      daily_achievements?: RawDailyAchievement[] | null
    }

    const achievements =
      raw.daily_achievements?.filter(
        (item): item is RawDailyAchievement => Boolean(item)
      ) ?? []

    if (!achievements.length) {
      return []
    }

    const fallbackTarget =
      raw.profile?.target_ml ??
      raw.profile?.default_target_ml ??
      0

    return achievements
      .map((achievement, index) => {
        const date =
          parseNullableDate(achievement.achievement_date) ??
          parseNullableDate(achievement.updated_at) ??
          parseNullableDate(achievement.created_at)

        if (!date) return null

        const total = achievement.total_intake_ml ?? 0
        const target =
          achievement.target_ml_used ??
          fallbackTarget ??
          0
        const percentage =
          target > 0 ? Math.round(Math.min((total / target) * 100, 999)) : null

        return {
          id: String(achievement.id ?? `${index}-${date.getTime()}`),
          date,
          total,
          target,
          success: Boolean(
            achievement.is_target_met ??
              (typeof percentage === 'number' && percentage >= 100)
          ),
          percentage,
        } satisfies DrinkHistoryRow
      })
      .filter((item): item is DrinkHistoryRow => item !== null)
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .slice(0, 7)
  }, [detail?.raw])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[1440px] max-h-[90vh] overflow-y-auto'>
        <DialogHeader className='text-start'>
          <DialogTitle>User Details</DialogTitle>
          <DialogDescription>
            {detail?.name ?? currentRow?.username ?? 'User overview'}
          </DialogDescription>
        </DialogHeader>

        {hydrationOverview ? (
          <Card className='border border-border/60 bg-card/60'>
            <CardHeader className='flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between'>
              <div>
                <CardTitle>Daily Hydration</CardTitle>
                <CardDescription>
                  {hydrationOverview.date
                    ? format(hydrationOverview.date, 'EEEE, dd MMM yyyy')
                    : 'Most recent synced hydration detail'}
                </CardDescription>
              </div>
              <span className='text-sm font-medium text-muted-foreground'>
                {hydrationOverview.isTargetMet
                  ? 'Target achieved'
                  : `${Math.round(hydrationOverview.percentage * 100)}% of target`}
              </span>
            </CardHeader>
            <CardContent className='flex flex-col gap-6 lg:flex-row lg:items-center'>
              <div className='relative mx-auto flex aspect-square w-full max-w-xs items-center justify-center'>
                <ResponsiveContainer width='100%' height='100%'>
                  <RadialBarChart
                    data={[{ name: 'intake', value: hydrationOverview.radialValue }]}
                    innerRadius='70%'
                    outerRadius='100%'
                    startAngle={225}
                    endAngle={-45}
                  >
                    <PolarAngleAxis type='number' domain={[0, 100]} tick={false} />
                    <RadialBar dataKey='value' fill={hydrationOverview.color} />
                  </RadialBarChart>
                </ResponsiveContainer>
                <div className='absolute flex flex-col items-center'>
                  <span className='text-3xl font-semibold'>
                    {hydrationOverview.total.toLocaleString()} ml
                  </span>
                  {hydrationOverview.target ? (
                    <span className='text-sm text-muted-foreground'>
                      of {hydrationOverview.target.toLocaleString()} ml
                    </span>
                  ) : null}
                </div>
              </div>

              <div className='h-48 w-full flex-1'>
                <ResponsiveContainer width='100%' height='100%'>
                  <LineChart
                    data={hydrationOverview.lineData}
                    margin={{ top: 8, right: 12, bottom: 8, left: 4 }}
                  >
                    <CartesianGrid stroke='var(--border)' strokeDasharray='6 6' opacity={0.35} />
                    <XAxis
                      dataKey='label'
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }}
                      padding={{ left: 8, right: 8 }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }}
                      width={48}
                      domain={[0, hydrationOverview.yMax]}
                    />
                    <RechartsTooltip
                      formatter={(value: number) => `${value} ml`}
                      labelFormatter={(label: string) => `${label}:00`}
                    />
                    <Line
                      type='monotone'
                      dataKey='volume'
                      stroke={hydrationOverview.color}
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 4 }}
                      isAnimationActive={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        ) : null}
        {drinkHistory.length ? (
          <Card className='border border-border/60 bg-card/60'>
            <CardHeader className='flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between'>
              <div>
                <CardTitle>Drink History</CardTitle>
                <CardDescription>
                  Insights from recent hydration achievements.
                </CardDescription>
              </div>
              <span className='text-sm font-medium text-muted-foreground'>
                Showing last {drinkHistory.length} day{drinkHistory.length > 1 ? 's' : ''}
              </span>
            </CardHeader>
            <CardContent className='p-0'>
              <div className='overflow-x-auto'>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead className='text-right'>Intake</TableHead>
                      <TableHead className='text-right'>Target</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {drinkHistory.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell>
                          <div className='font-semibold'>
                            {format(entry.date, 'dd MMM yyyy')}
                          </div>
                          <div className='text-xs text-muted-foreground'>
                            {format(entry.date, 'EEEE')}
                          </div>
                        </TableCell>
                        <TableCell className='text-right'>
                          {entry.total.toLocaleString()} <span className='text-xs text-muted-foreground'>ml</span>
                        </TableCell>
                        <TableCell className='text-right'>
                          {entry.target > 0 ? (
                            <>
                              {entry.target.toLocaleString()} <span className='text-xs text-muted-foreground'>ml</span>
                            </>
                          ) : (
                            <span className='text-muted-foreground'>-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className='flex flex-col'>
                            <span
                              className={
                                entry.success
                                  ? 'font-medium text-emerald-600 dark:text-emerald-400'
                                  : 'font-medium text-muted-foreground'
                              }
                            >
                              {entry.success ? 'Target met' : 'In progress'}
                            </span>
                            {entry.percentage !== null ? (
                              <span className='text-xs text-muted-foreground'>
                                {entry.percentage}% of target
                              </span>
                            ) : null}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        ) : null}

        <div className='grid grid-cols-1 gap-3 py-4 md:grid-cols-2 xl:grid-cols-3'>
          {error instanceof Error ? (
            <div className='rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive'>
              {error.message}
            </div>
          ) : null}

          <DisplayField
            label='Name'
            value={
              isPending
                ? 'Loading...'
                : detail?.name ?? currentRow?.username ?? '-'
            }
          />
          <DisplayField
            label='Email'
            value={isPending ? 'Loading...' : detail?.email ?? currentRow?.email ?? '-'}
          />
          <DisplayField
            label='Status'
            value={isPending ? 'Loading...' : detail?.status ?? '-'}
          />
          <DisplayField
            label='Email Verified'
            value={isPending ? 'Loading...' : emailVerified}
          />

          {profile ? (
            <>
              <div className='mt-2 text-sm font-semibold text-muted-foreground'>
                Profile
              </div>
              <DisplayField label='Username' value={profile.username ?? '-'} />
              <DisplayField label='Phone' value={profile.phone ?? '-'} />
              <DisplayField label='Address' value={profile.address ?? '-'} />
              <DisplayField label='Gender' value={profile.gender ?? '-'} />
              <DisplayField
                label='Activity'
                value={profile.activity ?? '-'}
              />
              <DisplayField
                label='Target ML'
                value={
                  profile.targetMl ?? profile.defaultTargetMl ?? '-'
                }
              />
              <DisplayField
                label='Weight'
                value={
                  profile.weight !== null && profile.weight !== undefined
                    ? `${profile.weight} kg`
                    : '-'
                }
              />
              <DisplayField
                label='Height'
                value={
                  profile.height !== null && profile.height !== undefined
                    ? `${profile.height} cm`
                    : '-'
                }
              />
            </>
          ) : null}

          {stats ? (
            <>
              <div className='mt-2 text-sm font-semibold text-muted-foreground'>
                Engagement
              </div>
              <DisplayField label='Followers' value={stats.followers.toString()} />
              <DisplayField label='Following' value={stats.following.toString()} />
              <DisplayField
                label='Muted Users'
                value={stats.mutedUsers.toString()}
              />
              <DisplayField
                label='Muting Users'
                value={stats.mutingUsers.toString()}
              />
              <DisplayField
                label='Blocked Users'
                value={stats.blockedUsers.toString()}
              />
              <DisplayField
                label='Blocked By Users'
                value={stats.blockedByUsers.toString()}
              />
              <DisplayField
                label='Sent Reports'
                value={stats.sentReports.toString()}
              />
              <DisplayField
                label='Received Reports'
                value={stats.receivedReports.toString()}
              />
              <DisplayField
                label='Alarm Events'
                value={stats.alarmEvents.toString()}
              />
              <DisplayField
                label='Daily Achievements'
                value={stats.dailyAchievements.toString()}
              />
              <DisplayField
                label='Intake Drink Logs'
                value={stats.intakeDrinkLogs.toString()}
              />
            </>
          ) : null}

          {/* {detail ? (
            <details className='rounded-md border border-border/60 bg-muted/20 px-3 py-2 text-sm shadow-sm transition open:shadow-sm'>
              <summary className='cursor-pointer font-medium text-muted-foreground'>
                Raw data
              </summary>
              <pre className='mt-2 max-h-60 overflow-auto rounded-md bg-background p-2 text-xs'>
                {JSON.stringify(detail.raw, null, 2)}
              </pre>
            </details>
          ) : null} */}
        </div>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
