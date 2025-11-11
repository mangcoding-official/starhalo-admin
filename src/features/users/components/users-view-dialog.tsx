"use client"

import { useMemo, useState } from 'react'
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
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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

type DrinkHistoryRow = {
  id: string
  date: Date
  total: number
  target: number
  success: boolean
  percentage: number
}

function parseNullableDate(value?: string | null) {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

export function UsersViewDialog({ currentRow, open, onOpenChange }: UsersViewDialogProps) {
  const [reportType, setReportType] = useState<'weekly' | 'monthly'>('weekly')
  const [dateRange, setDateRange] = useState<{ start?: string; end?: string }>({})
  const userId = currentRow?.id ?? null
  const hasCompleteRange = Boolean(dateRange.start && dateRange.end)
  const { data, isLoading, isFetching, error } = useUserDetailQuery(userId, open, {
    reportType,
    startDate: hasCompleteRange ? dateRange.start : undefined,
    endDate: hasCompleteRange ? dateRange.end : undefined,
  })

  const detail = data

  console.log("detail", detail)

  const emailVerified =
    detail?.emailVerifiedAt && !Number.isNaN(detail.emailVerifiedAt.getTime())
      ? format(detail.emailVerifiedAt, 'dd MMM yyyy HH:mm')
      : detail?.emailVerifiedAt === null
        ? 'Not verified'
        : '-'

  const isPending = isLoading || isFetching

  const profile = detail?.profile
  const stats = detail?.stats
  const rawDetail = detail?.raw

  const followersAll = useMemo(
    () => extractRecordArray(rawDetail?.followers_all),
    [rawDetail]
  )
  const mutedUsersList = useMemo(
    () => extractRecordArray(rawDetail?.mutedUsers ?? rawDetail?.muted_users),
    [rawDetail]
  )
  const blockedUsersList = useMemo(
    () => extractRecordArray(rawDetail?.blockedUsers ?? rawDetail?.blocked_users),
    [rawDetail]
  )
  const sentReportsList = useMemo(
    () => extractRecordArray(rawDetail?.sentReports ?? rawDetail?.sent_reports),
    [rawDetail]
  )
  const alarmSettingData = useMemo(() => {
    const candidate = rawDetail?.alarmSetting ?? rawDetail?.alarm_setting
    return isRecord(candidate) ? candidate : null
  }, [rawDetail])
  const notificationSummary = useMemo(
    () => (isRecord(rawDetail?.my_notification) ? rawDetail?.my_notification : null),
    [rawDetail]
  )
  const newFollowersList = useMemo(
    () => extractRecordArray(notificationSummary?.['new_follower']),
    [notificationSummary]
  )
  const dailyFollowerProgressList = useMemo(
    () => extractRecordArray(notificationSummary?.['daily_follower_progress_list']),
    [notificationSummary]
  )
  const todayNotifications = useMemo(
    () => extractRecordArray(notificationSummary?.['today_notification']),
    [notificationSummary]
  )
  const lastWeekNotifications = useMemo(
    () => extractRecordArray(notificationSummary?.['last_week_notification']),
    [notificationSummary]
  )
  const todayDrinkLogs = useMemo(
    () => extractRecordArray(rawDetail?.my_today_drink_logs),
    [rawDetail]
  )
  const thumblerData = useMemo(
    () => (isRecord(rawDetail?.my_thumbler) ? (rawDetail?.my_thumbler as UnknownRecord) : null),
    [rawDetail]
  )
  const hydrationReport = useMemo(
    () => (isRecord(rawDetail?.my_hydration) ? (rawDetail?.my_hydration as UnknownRecord) : null),
    [rawDetail]
  )
  const hydrationSummary = useMemo(
    () => getRecordField(hydrationReport ?? {}, ['summary']),
    [hydrationReport]
  )
  const hydrationSummaryMeta = useMemo(
    () => getRecordField(hydrationSummary ?? {}, ['meta']),
    [hydrationSummary]
  )
  const reportPeriod = getStringField(hydrationReport ?? {}, ['report_period'])
  const reportTypeLabel = getStringField(hydrationReport ?? {}, ['type'])
  const weeklyProgressList = useMemo(
    () => extractRecordArray(thumblerData?.weekly_progress_list),
    [thumblerData]
  )

  const hydrationOverview = useMemo(() => {
    if (!thumblerData) {
      return null
    }

    const dailyProgress = getRecordField(thumblerData, ['daily_progress'])
    if (!dailyProgress) {
      return null
    }

    const target =
      getNumberField(dailyProgress, ['daily_target_ml']) ??
      profile?.targetMl ??
      profile?.defaultTargetMl ??
      0
    const total = getNumberField(dailyProgress, ['current_intake_ml']) ?? 0
    const progressPct =
      getNumberField(dailyProgress, ['progress_percentage']) ??
      (target > 0 ? (total / target) * 100 : 0)
    const percentage = target > 0 ? Math.min(total / target, 1) : 0
    const accentColor = '#6BC691'

    const hourlyData = extractRecordArray(
      Array.isArray((thumblerData as UnknownRecord).hourly_graph_data)
        ? (thumblerData as UnknownRecord).hourly_graph_data
        : []
    )

    const lineData =
      hourlyData.length > 0
        ? hourlyData.map((entry, index) => {
            const hour = getNumberField(entry, ['hour']) ?? index
            const volume =
              getNumberField(entry, ['volume_ml', 'intake_ml']) ?? 0
            return {
              hour,
              label: String(hour).padStart(2, '0'),
              volume,
            }
          })
        : [{ hour: 0, label: '00', volume: total }]

    const maxVolume = lineData.reduce(
      (max, item) => Math.max(max, item.volume),
      0
    )
    const yAxisCandidate = Math.max(maxVolume, total, target)
    const yMax = Math.max(100, Math.ceil((yAxisCandidate || 100) / 100) * 100)

    const reportMeta = getRecordField(
      getRecordField(hydrationReport ?? {}, ['summary']) ?? {},
      ['meta']
    )
    const date =
      parseNullableDate(
        getStringField(reportMeta ?? {}, ['startDate', 'start_date'])
      ) ?? null

    return {
      total,
      target,
      percentage,
      radialValue: Math.round(Math.min(progressPct, 100)),
      lineData,
      yMax,
      date,
      isTargetMet: percentage >= 1,
      color: accentColor,
    }
  }, [thumblerData, hydrationReport, profile?.defaultTargetMl, profile?.targetMl])

  const drinkHistory = useMemo<DrinkHistoryRow[]>(() => {
    const progressList = extractRecordArray(hydrationReport?.progress_list)
    if (!progressList.length) {
      return []
    }

    const target =
      profile?.targetMl ??
      profile?.defaultTargetMl ??
      getNumberField(getRecordField(thumblerData ?? {}, ['daily_progress']) ?? {}, ['daily_target_ml']) ??
      0

    const rows = progressList
      .map((entry, index) => {
        const rawDate =
          getStringField(entry, ['full_date']) ?? getStringField(entry, ['date'])
        const date = parseNullableDate(rawDate)
        if (!date) return null

        const percentageRaw = getNumberField(entry, ['progress_percentage']) ?? 0
        const percentage = Math.max(0, Math.round(percentageRaw * 100) / 100)
        const total =
          target > 0 ? Math.round((percentage / 100) * target) : 0

        return {
          id: `${entry.day ?? index}-${date.getTime()}`,
          date,
          total,
          target,
          success: percentage >= 100,
          percentage,
        }
      })
      .filter((item): item is DrinkHistoryRow => Boolean(item))

    return rows.sort((a, b) => b.date.getTime() - a.date.getTime())
  }, [hydrationReport, profile?.defaultTargetMl, profile?.targetMl, thumblerData])

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
            <CardHeader className='flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between'>
              <div>
                <CardTitle>Daily Hydration</CardTitle>
                <CardDescription>
                  {hydrationOverview.date
                    ? format(hydrationOverview.date, 'EEEE, dd MMM yyyy')
                    : 'Most recent synced hydration detail'}
                </CardDescription>
              </div>
              <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-3'>
                <span className='text-sm font-medium text-muted-foreground'>
                  {hydrationOverview.isTargetMet
                    ? 'Target achieved'
                    : `${Math.round(hydrationOverview.percentage * 100)}% of target`}
                </span>
              </div>
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
        ) : (
          <Card className='border border-border/60 bg-card/60'>
            <CardHeader>
              <CardTitle>Daily Hydration</CardTitle>
              <CardDescription>No hydration data available for the selected period.</CardDescription>
            </CardHeader>
          </Card>
        )}

        <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-3'>
          <div className='flex flex-wrap items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground'>
            <span>Report</span>
            <Select
              value={reportType}
              onValueChange={(value) => setReportType(value as 'weekly' | 'monthly')}
            >
              <SelectTrigger className='h-8 w-[120px]'>
                <SelectValue placeholder='Weekly' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='weekly'>Weekly</SelectItem>
                <SelectItem value='monthly'>Monthly</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className='flex flex-wrap items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground'>
            <span>Range</span>
            <Input
              type='date'
              value={dateRange.start ?? ''}
              onChange={(event) =>
                setDateRange((prev) => ({ ...prev, start: event.target.value || undefined }))
              }
              className='h-8 w-[160px] text-xs'
            />
            <span className='text-muted-foreground'>to</span>
            <Input
              type='date'
              value={dateRange.end ?? ''}
              onChange={(event) =>
                setDateRange((prev) => ({ ...prev, end: event.target.value || undefined }))
              }
              className='h-8 w-[160px] text-xs'
              min={dateRange.start}
            />
            <Button
              type='button'
              variant='ghost'
              size='sm'
              className='h-7 text-[11px] uppercase'
              onClick={() => setDateRange({})}
              disabled={!dateRange.start && !dateRange.end}
            >
              Clear
            </Button>
          </div>
        </div>

        {(hydrationSummary || reportPeriod || weeklyProgressList.length) ? (
          <div className='grid grid-cols-1 gap-4 lg:grid-cols-2'>
            {(hydrationSummary || reportPeriod) ? (
              <Card className='border border-border/60 bg-card/60'>
                <CardHeader className='flex justify-between w-full'>
                  <div className=''>
                    <CardTitle>Hydration Summary</CardTitle>
                    <CardDescription>
                      {reportPeriod ?? 'Aggregated metrics based on the selected range.'}
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className='grid grid-cols-2 gap-3 text-sm md:grid-cols-3'>
                    {reportTypeLabel ? (
                      <div className='rounded-md border border-border/50 bg-muted/20 p-3'>
                        <p className='text-xs uppercase text-muted-foreground'>Type</p>
                        <p className='font-semibold capitalize'>{reportTypeLabel}</p>
                      </div>
                    ) : null}
                    {hydrationSummary ? (
                      <>
                        <SummaryStat
                          label='Avg Intake'
                          value={`${getNumberField(hydrationSummary, ['avg_intake_ml']) ?? 0} ml`}
                        />
                        <SummaryStat
                          label='Avg Success'
                          value={`${getNumberField(hydrationSummary, ['avg_success_rate']) ?? 0}%`}
                        />
                        <SummaryStat
                          label='Day Streak'
                          value={`${getNumberField(hydrationSummary, ['day_streak']) ?? 0} days`}
                        />
                        <SummaryStat
                          label='Notifications'
                          value={getStringField(hydrationSummary, ['notification_display']) ?? '0/0'}
                        />
                      </>
                    ) : null}
                    {hydrationSummaryMeta ? (
                      <>
                        <SummaryStat
                          label='Total Intake'
                          value={`${getNumberField(hydrationSummaryMeta, ['sumIntakeMl']) ?? 0} ml`}
                        />
                        <SummaryStat
                          label='Total Success'
                          value={`${getNumberField(hydrationSummaryMeta, ['sumSuccessRate']) ?? 0}%`}
                        />
                      </>
                    ) : null}
                  </div>
                </CardContent>
              </Card>
            ) : null}

            {weeklyProgressList.length ? (
              <Card className='border border-border/60 bg-card/60'>
                <CardHeader>
                  <CardTitle>Weekly Progress</CardTitle>
                  <CardDescription>Daily completion rate across the selected period.</CardDescription>
                </CardHeader>
                <CardContent className='grid grid-cols-2 gap-3 text-sm md:grid-cols-3'>
                  {weeklyProgressList.map((dayData, index) => {
                    const dayLabel = getStringField(dayData, ['day']) ?? `Day ${index + 1}`
                    const pct = getNumberField(dayData, ['progress_percentage']) ?? 0
                    const statusClass =
                      pct >= 100
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : pct >= 50
                          ? 'text-amber-600'
                          : 'text-muted-foreground'
                    return (
                      <div
                        key={`progress-${dayLabel}-${index}`}
                        className='rounded-md border border-border/40 bg-muted/10 px-3 py-2'
                      >
                        <div className='text-xs uppercase text-muted-foreground'>{dayLabel}</div>
                        <div className={`text-lg font-semibold ${statusClass}`}>{pct}%</div>
                      </div>
                    )
                  })}
                </CardContent>
              </Card>
            ) : null}
          </div>
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

        {(alarmSettingData || followersAll.length || mutedUsersList.length || blockedUsersList.length || sentReportsList.length) ? (
          <div className='grid grid-cols-1 gap-4 py-4 lg:grid-cols-2'>
            {alarmSettingData ? (
              <Card className='border border-border/60 bg-card/60'>
                <CardHeader>
                  <CardTitle>Alarm Settings</CardTitle>
                  <CardDescription>Most recent hydrated alarm configuration.</CardDescription>
                </CardHeader>
                <CardContent>
                  <dl className='space-y-2 text-sm'>
                    {Object.entries(alarmSettingData).map(([key, value]) => (
                      <div key={key} className='flex items-start justify-between gap-4 rounded-md border border-border/40 bg-muted/10 px-3 py-2'>
                        <dt className='text-xs font-medium uppercase tracking-wide text-muted-foreground'>
                          {formatKeyLabel(key)}
                        </dt>
                        <dd className='flex-1 text-right text-sm font-semibold' style={{
                          wordBreak: "break-all"
                        }}>
                          {formatValueDisplay(value)}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </CardContent>
              </Card>
            ) : null}

            {followersAll.length ? (
              <Card className='border border-border/60 bg-card/60'>
                <CardHeader>
                  <CardTitle>Followers</CardTitle>
                  <CardDescription>Showing the latest {Math.min(followersAll.length, 8)} followers</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className='space-y-2 text-sm'>
                    {followersAll.slice(0, 8).map((item, index) => {
                      const user = formatUserListItem(item)
                      return (
                        <li
                          key={`follower-${user.primary}-${index}`}
                          className='rounded-md border border-border/40 bg-muted/10 px-3 py-2'
                        >
                          <div className='font-semibold'>{user.primary}</div>
                          {user.secondary ? (
                            <div className='text-xs text-muted-foreground'>{user.secondary}</div>
                          ) : null}
                        </li>
                      )
                    })}
                    {followersAll.length > 8 ? (
                      <li className='text-xs text-muted-foreground'>
                        +{followersAll.length - 8} more followers
                      </li>
                    ) : null}
                  </ul>
                </CardContent>
              </Card>
            ) : null}

            {mutedUsersList.length ? (
              <Card className='border border-border/60 bg-card/60'>
                <CardHeader>
                  <CardTitle>Muted Users</CardTitle>
                  <CardDescription>Users currently muted by this account.</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className='space-y-2 text-sm'>
                    {mutedUsersList.slice(0, 8).map((item, index) => {
                      const user = formatUserListItem(item)
                      return (
                        <li
                          key={`muted-${user.primary}-${index}`}
                          className='rounded-md border border-border/40 bg-muted/10 px-3 py-2'
                        >
                          <div className='font-semibold'>{user.primary}</div>
                          {user.secondary ? (
                            <div className='text-xs text-muted-foreground'>{user.secondary}</div>
                          ) : null}
                        </li>
                      )
                    })}
                    {mutedUsersList.length > 8 ? (
                      <li className='text-xs text-muted-foreground'>
                        +{mutedUsersList.length - 8} more muted users
                      </li>
                    ) : null}
                  </ul>
                </CardContent>
              </Card>
            ) : null}

            {blockedUsersList.length ? (
              <Card className='border border-border/60 bg-card/60'>
                <CardHeader>
                  <CardTitle>Blocked Users</CardTitle>
                  <CardDescription>Accounts blocked by this user.</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className='space-y-2 text-sm'>
                    {blockedUsersList.slice(0, 8).map((item, index) => {
                      const user = formatUserListItem(item)
                      return (
                        <li
                          key={`blocked-${user.primary}-${index}`}
                          className='rounded-md border border-border/40 bg-muted/10 px-3 py-2'
                        >
                          <div className='font-semibold'>{user.primary}</div>
                          {user.secondary ? (
                            <div className='text-xs text-muted-foreground'>{user.secondary}</div>
                          ) : null}
                        </li>
                      )
                    })}
                    {blockedUsersList.length > 8 ? (
                      <li className='text-xs text-muted-foreground'>
                        +{blockedUsersList.length - 8} more blocked users
                      </li>
                    ) : null}
                  </ul>
                </CardContent>
              </Card>
            ) : null}

            {sentReportsList.length ? (
              <Card className='border border-border/60 bg-card/60 lg:col-span-2'>
                <CardHeader>
                  <CardTitle>Sent Reports</CardTitle>
                  <CardDescription>Latest moderation reports filed by this user.</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className='space-y-2 text-sm'>
                    {sentReportsList.slice(0, 6).map((entry, index) => {
                      const reason =
                        getStringField(entry, ['reason', 'category', 'type']) ?? `Report #${index + 1}`
                      const targetUser = getRecordField(entry, ['reported_user', 'target_user', 'user'])
                      const targetLabel = targetUser ? formatUserListItem(targetUser).primary : undefined
                      const createdAt = formatTimestamp(getStringField(entry, ['created_at', 'submitted_at']))
                      return (
                        <li
                          key={`report-${reason}-${index}`}
                          className='rounded-md border border-border/40 bg-muted/10 px-3 py-2'
                        >
                          <div className='font-semibold'>{reason}</div>
                          {targetLabel ? (
                            <div className='text-xs text-muted-foreground'>Target: {targetLabel}</div>
                          ) : null}
                          {createdAt ? (
                            <div className='text-xs text-muted-foreground'>Filed {createdAt}</div>
                          ) : null}
                        </li>
                      )
                    })}
                    {sentReportsList.length > 6 ? (
                      <li className='text-xs text-muted-foreground'>
                        +{sentReportsList.length - 6} additional reports
                      </li>
                    ) : null}
                  </ul>
                </CardContent>
              </Card>
            ) : null}
          </div>
        ) : null}

        {notificationSummary || newFollowersList.length || todayNotifications.length || lastWeekNotifications.length ? (
          <Card className='border border-border/60 bg-card/60'>
            <CardHeader>
              <CardTitle>Notifications</CardTitle>
              <CardDescription>Recent engagement and follower updates.</CardDescription>
            </CardHeader>
            <CardContent className='space-y-6 text-sm'>
              {newFollowersList.length ? (
                <section>
                  <div className='mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground'>
                    New Followers
                  </div>
                  <ul className='space-y-2'>
                    {newFollowersList.slice(0, 6).map((item, index) => {
                      const user = formatUserListItem(item)
                      return (
                        <li
                          key={`notif-new-${user.primary}-${index}`}
                          className='rounded-md border border-border/40 bg-muted/10 px-3 py-2'
                        >
                          <div className='font-semibold'>{user.primary}</div>
                          {user.secondary ? (
                            <div className='text-xs text-muted-foreground'>{user.secondary}</div>
                          ) : null}
                        </li>
                      )
                    })}
                  </ul>
                </section>
              ) : null}

              {dailyFollowerProgressList.length ? (
                <section>
                  <div className='mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground'>
                    Follower Progress
                  </div>
                  <ul className='space-y-2'>
                    {dailyFollowerProgressList.slice(0, 5).map((item, index) => {
                      const follower = getRecordField(item, ['user'])
                      const user = formatUserListItem(follower ?? item)
                      const progress = getNumberField(item, ['progress_percentage'])
                      return (
                        <li
                          key={`progress-${user.primary}-${index}`}
                          className='rounded-md border border-border/40 bg-muted/10 px-3 py-2'
                        >
                          <div className='font-semibold'>{user.primary}</div>
                          <div className='text-xs text-muted-foreground'>
                            Progress: {progress !== undefined ? `${progress}%` : 'n/a'}
                          </div>
                        </li>
                      )
                    })}
                  </ul>
                </section>
              ) : null}

              {todayNotifications.length ? (
                <section>
                  <div className='mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground'>
                    Today
                  </div>
                  <ul className='space-y-2'>
                    {todayNotifications.slice(0, 5).map((item, index) => {
                      const title =
                        getStringField(item, ['title', 'pattern']) ??
                        `Notification #${index + 1}`
                      const timestamp = formatTimestamp(getStringField(item, ['created_at']))
                      return (
                        <li
                          key={`today-notif-${index}`}
                          className='rounded-md border border-border/40 bg-muted/10 px-3 py-2'
                        >
                          <div className='font-semibold'>{title}</div>
                          {timestamp ? (
                            <div className='text-xs text-muted-foreground'>{timestamp}</div>
                          ) : null}
                        </li>
                      )
                    })}
                  </ul>
                </section>
              ) : null}

              {lastWeekNotifications.length ? (
                <section>
                  <div className='mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground'>
                    Last Week
                  </div>
                  <ul className='space-y-2'>
                    {lastWeekNotifications.slice(0, 5).map((item, index) => {
                      const title =
                        getStringField(item, ['title', 'pattern']) ??
                        `Notification #${index + 1}`
                      const timestamp = formatTimestamp(getStringField(item, ['created_at']))
                      return (
                        <li
                          key={`lastweek-notif-${index}`}
                          className='rounded-md border border-border/40 bg-muted/10 px-3 py-2'
                        >
                          <div className='font-semibold'>{title}</div>
                          {timestamp ? (
                            <div className='text-xs text-muted-foreground'>{timestamp}</div>
                          ) : null}
                        </li>
                      )
                    })}
                  </ul>
                </section>
              ) : null}

              {!newFollowersList.length && !dailyFollowerProgressList.length && !todayNotifications.length && !lastWeekNotifications.length ? (
                <p className='text-sm text-muted-foreground'>No notification data available.</p>
              ) : null}
            </CardContent>
          </Card>
        ) : null}

        {todayDrinkLogs.length ? (
          <Card className='border border-border/60 bg-card/60'>
            <CardHeader>
              <CardTitle>Today's Drink Logs</CardTitle>
              <CardDescription>Latest entries synced for the current day.</CardDescription>
            </CardHeader>
            <CardContent className='overflow-x-auto'>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Client Time</TableHead>
                    <TableHead>Server Time</TableHead>
                    <TableHead className='text-right'>Intake</TableHead>
                    <TableHead className='text-right'>Target</TableHead>
                    <TableHead className='text-right'>Progress</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {todayDrinkLogs.slice(0, 8).map((log, index) => {
                    const clientTime = getStringField(log, ['client_time', 'time'])
                    const serverTime = getStringField(log, ['server_time', 'created_at'])
                    const intake = getNumberField(log, ['intake_ml', 'intake', 'volume_ml'])
                    const target = getNumberField(log, ['target_ml'])
                    const progress = getNumberField(log, ['success_percentage', 'progress_percentage'])
                    return (
                      <TableRow key={`today-log-${index}`}>
                        <TableCell>{clientTime ?? '—'}</TableCell>
                        <TableCell>{serverTime ? formatTimestamp(serverTime) : '—'}</TableCell>
                        <TableCell className='text-right'>
                          {intake !== undefined ? `${intake} ml` : '—'}
                        </TableCell>
                        <TableCell className='text-right'>
                          {target !== undefined ? `${target} ml` : '—'}
                        </TableCell>
                        <TableCell className='text-right'>
                          {progress !== undefined ? `${progress}%` : '—'}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
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

type UnknownRecord = Record<string, unknown>

function isRecord(value: unknown): value is UnknownRecord {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function extractRecordArray(value: unknown): UnknownRecord[] {
  if (!Array.isArray(value)) return []
  return value
    .map((item) => (isRecord(item) ? item : null))
    .filter((item): item is UnknownRecord => item !== null)
}

function getStringField(record: UnknownRecord, keys: string[]): string | undefined {
  for (const key of keys) {
    const raw = record[key]
    if (typeof raw === 'string' && raw.trim().length > 0) {
      return raw.trim()
    }
  }
  return undefined
}

function getNumberField(record: UnknownRecord, keys: string[]): number | undefined {
  for (const key of keys) {
    const raw = record[key]
    const parsed =
      typeof raw === 'number'
        ? raw
        : typeof raw === 'string' && raw.trim() !== ''
          ? Number(raw)
          : undefined
    if (typeof parsed === 'number' && !Number.isNaN(parsed)) {
      return parsed
    }
  }
  return undefined
}

function getRecordField(record: UnknownRecord, keys: string[]): UnknownRecord | undefined {
  for (const key of keys) {
    const candidate = record[key]
    if (isRecord(candidate)) {
      return candidate
    }
  }
  return undefined
}

function formatUserListItem(entry: UnknownRecord | null | undefined): { primary: string; secondary?: string } {
  if (!entry) {
    return { primary: 'Unknown user' }
  }
  const primary =
    getStringField(entry, ['username', 'name', 'email', 'title']) ??
    (typeof entry.id === 'string' || typeof entry.id === 'number'
      ? `User ${entry.id}`
      : 'Unknown user')
  const secondary = getStringField(entry, ['email', 'pattern', 'role'])
  return { primary, secondary }
}

function formatKeyLabel(key: string): string {
  return key
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

function formatValueDisplay(value: unknown): string {
  if (value === null || typeof value === 'undefined') return '—'
  if (typeof value === 'boolean') return value ? 'Enabled' : 'Disabled'
  if (typeof value === 'number') return value.toString()
  if (typeof value === 'string') return value
  if (Array.isArray(value)) {
    const formatted = value
      .map((entry) => {
        if (entry === null || typeof entry === 'undefined') return ''
        if (typeof entry === 'string' || typeof entry === 'number') {
          return String(entry)
        }
        return JSON.stringify(entry)
      })
      .filter((entry) => entry.trim().length > 0)
    return formatted.length ? formatted.join(', ') : '—'
  }
  return JSON.stringify(value)
}

function formatTimestamp(value: string | undefined): string | undefined {
  if (!value) return undefined
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return value
  }
  return format(parsed, 'dd MMM yyyy HH:mm')
}

type SummaryStatProps = {
  label: string
  value: string | number
}

function SummaryStat({ label, value }: SummaryStatProps) {
  return (
    <div className='rounded-md border border-border/40 bg-muted/10 px-3 py-2'>
      <p className='text-xs uppercase text-muted-foreground'>{label}</p>
      <p className='text-lg font-semibold'>{value}</p>
    </div>
  )
}
