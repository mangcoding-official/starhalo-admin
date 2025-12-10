"use client"

import { type ReactNode, useMemo, useState } from 'react'
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
import { ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTranslation } from '@/lib/i18n'
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { DisplayField } from './users-view-display-field.tsx'
import { cn } from '@/lib/utils'
import { type User } from '../data/schema'
import { useUserDetailQuery } from '../hooks/use-user-detail-query'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

type UsersViewDialogProps = {
  currentRow?: User | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

type DrinkHistoryRow = {
  id: string
  date: Date
  total: number
  success: boolean
  percentage: number
}

type FollowerRow = {
  id: string
  user: FormattedUserListItem
  context?: string
  followedAt?: string
}

type DetailSectionKey = 'overview' | 'hydration' | 'drinkHistory' | 'engagement' | 'notifications'

function parseNullableDate(value?: string | null) {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

export function UsersViewDialog({ currentRow, open, onOpenChange }: UsersViewDialogProps) {
  const { t } = useTranslation()
  const [reportType, setReportType] = useState<'weekly' | 'monthly'>('weekly')
  const [dateRange, setDateRange] = useState<{ start?: string; end?: string }>({})
  const [openSection, setOpenSection] = useState<DetailSectionKey | null>('overview')
  const userId = currentRow?.id ?? null
  const hasCompleteRange = Boolean(dateRange.start && dateRange.end)
  const { data, isLoading, isFetching, error } = useUserDetailQuery(userId, open, {
    reportType,
    startDate: hasCompleteRange ? dateRange.start : undefined,
    endDate: hasCompleteRange ? dateRange.end : undefined,
  })

  const detail = data

  // debug: detail fetched for user view

  const emailVerified =
    detail?.emailVerifiedAt && !Number.isNaN(detail.emailVerifiedAt.getTime())
      ? format(detail.emailVerifiedAt, 'dd MMM yyyy HH:mm')
      : detail?.emailVerifiedAt === null
        ? 'Not verified'
        : '-'

  const isPending = isLoading || isFetching

  const profile = detail?.profile
  // const stats = detail?.stats
  const rawDetail = detail?.raw
  const rawProfileUsername =
    typeof profile?.username === 'string' ? profile.username : null
  const rawDetailName =
    typeof detail?.name === 'string' ? detail.name : null
  const rawListUsername =
    typeof currentRow?.username === 'string' ? currentRow.username : null
  const normalizedProfileUsername =
    rawProfileUsername && rawProfileUsername.trim().length > 0
      ? rawProfileUsername.trim()
      : null
  const normalizedDetailName =
    rawDetailName && rawDetailName.trim().length > 0
      ? rawDetailName.trim()
      : null
  const normalizedListUsername =
    rawListUsername && rawListUsername.trim().length > 0
      ? rawListUsername.trim()
      : null
  const canonicalDisplayName =
    normalizedProfileUsername ?? normalizedDetailName ?? normalizedListUsername ?? null
  const headerSubtitle =
    canonicalDisplayName ?? t('users.view.dialog.subtitleFallback', 'User overview')
  const handleToggleSection = (section: DetailSectionKey, isOpen: boolean) => {
    setOpenSection(isOpen ? section : null)
  }

  const followersAll = useMemo(
    () => extractRecordArray(rawDetail?.followers_all),
    [rawDetail]
  )
  const followerRows = useMemo<FollowerRow[]>(() => {
    if (!followersAll.length) return []

    return followersAll.reduce<FollowerRow[]>((acc, entry, index) => {
      const statusKey = getFollowerStatus(entry)
      if (!isAcceptedFollowerStatus(statusKey)) {
        return acc
      }

      const user = formatUserListItem(entry)
      const pivot = getRecordField(entry ?? {}, ['pivot', 'meta'])
      const identifier =
        getStringField(entry ?? {}, ['id', 'uuid']) ??
        getStringField(pivot ?? {}, ['id', 'uuid']) ??
        `${user.primary}-${index}`

      const followedAt =
        formatTimestamp(
          getStringField(entry ?? {}, ['created_at', 'followed_at', 'updated_at', 'time']) ??
            getStringField(pivot ?? {}, ['created_at', 'followed_at', 'timestamp'])
        ) ?? undefined

      acc.push({
        id: identifier,
        user,
        context: formatFollowerContext(entry, statusKey),
        followedAt,
      })

      return acc
    }, [])
  }, [followersAll])
  const followingList = useMemo(
    () => extractRecordArray(rawDetail?.following),
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

  const formatBooleanLabel = (value?: boolean | null) => {
    if (typeof value === 'boolean') {
      return value
        ? t('common.boolean.yes', 'Yes')
        : t('common.boolean.no', 'No')
    }
    return t('common.boolean.unspecified', '-')
  }

  const alarmValueLabels = useMemo(
    () => ({
      empty: t('users.view.alarm.empty', '—'),
      enabled: t('common.enabled', 'Enabled'),
      disabled: t('common.disabled', 'Disabled'),
    }),
    [t]
  )

  const profileDisplayFields = useMemo(() => {
    if (!profile) return []
    const preferredTarget =
      typeof profile.targetMl === 'number' ? profile.targetMl : profile.defaultTargetMl

    return [
      { label: t('users.view.fields.userId', 'User ID'), value: profile.userId ?? '-' },
      // { label: 'Username', value: profile.username ?? '-' },
      { label: t('users.view.fields.email', 'Email'), value: detail?.email ?? currentRow?.email ?? '-' },
      {
        label: t('users.view.fields.dateOfBirth', 'Date of Birth'),
        value: formatProfileDate(profile.dateOfBirth),
      },
      {
        label: t('users.view.fields.username', 'Username'),
        value: (
          <ProfileAvatarPreview
            src={profile.avatar}
            fallback={
              profile.username ?? canonicalDisplayName ?? t('users.view.fields.defaultName', 'User')
            }
            openLabel={t('users.view.profile.openAvatar', 'Open avatar')}
            defaultLabel={t('users.view.profile.defaultAvatar', 'Default avatar')}
          />
        ),
      },
      { label: t('users.view.fields.age', 'Age'), value: profile.age ?? '-' },
      { label: t('users.view.fields.gender', 'Gender'), value: profile.gender ?? '-' },
      { label: t('users.view.fields.height', 'Height'), value: formatMeasurement(profile.height, 'cm') },
      { label: t('users.view.fields.weight', 'Weight'), value: formatMeasurement(profile.weight, 'kg') },
      { label: t('users.view.fields.activity', 'Activity'), value: profile.activity ?? '-' },
      { label: t('users.view.fields.target', 'Target (ml)'), value: formatMeasurement(preferredTarget, 'ml') },
      {
        label: t('users.view.fields.defaultTarget', 'Default Target (ml)'),
        value: formatMeasurement(profile.defaultTargetMl, 'ml'),
      },
      {
        label: t('users.view.fields.targetEditable', 'Target Editable'),
        value: formatBooleanLabel(profile.isTargetMlEditable),
      },
      { label: t('users.view.fields.pregnant', 'Pregnant'), value: formatBooleanLabel(profile.isPregnant) },
      { label: t('users.view.fields.lactating', 'Lactating'), value: formatBooleanLabel(profile.isLactating) },
      {
        label: t('users.view.fields.privateAccount', 'Private Account'),
        value: formatBooleanLabel(profile.isPrivate),
      },
      { label: t('users.view.fields.pattern', 'Pattern'), value: profile.pattern ?? '-' },
      {
        label: t('users.view.fields.color', 'Color'),
        value: profile.color ? (
          <ProfileColorSwatch
            color={profile.color}
            label={t('users.view.fields.colorPreview', 'Profile color preview')}
          />
        ) : (
          '-'
        ),
      },
      { label: t('users.view.fields.deviceId', 'Device ID'), value: profile.deviceId ?? '-' },
      { label: t('users.view.fields.ledEnabled', 'LED Enabled'), value: formatBooleanLabel(profile.isLed) },
      {
        label: t('users.view.fields.vibrationEnabled', 'Vibration Enabled'),
        value: formatBooleanLabel(profile.isFibration),
      },
      {
        label: t('users.view.fields.alarmEnabled', 'Alarm Enabled'),
        value: formatBooleanLabel(profile.isAlarm),
      },
      // {
      //   label: t('users.view.fields.agreeService', 'Agree: Service'),
      //   value: formatBooleanLabel(profile.isAgreeService),
      // },
      // {
      //   label: t('users.view.fields.agreePrivate', 'Agree: Private Data'),
      //   value: formatBooleanLabel(profile.isAgreePrivateData),
      // },
      // {
      //   label: t('users.view.fields.agreeLocation', 'Agree: Location'),
      //   value: formatBooleanLabel(profile.isAgreeLocation),
      // },
      // {
      //   label: t('users.view.fields.agreeMarketing', 'Agree: Marketing'),
      //   value: formatBooleanLabel(profile.isAgreeMarketing),
      // },
      {
        label: t('users.view.fields.notificationsMuted', 'Notifications Muted'),
        value: formatBooleanLabel(profile.isNotificationMuted),
      },
      {
        label: t('users.view.fields.informationMuted', 'Information Muted'),
        value: formatBooleanLabel(profile.isInformationMuted),
      },
      { label: t('users.view.fields.streak', 'Streak'), value: profile.streak ?? '-' },
    ]
  }, [profile, canonicalDisplayName, t])
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
          success: percentage >= 100,
          percentage,
        }
      })
      .filter((item): item is DrinkHistoryRow => Boolean(item))

    return rows.sort((a, b) => a.date.getTime() - b.date.getTime())
  }, [hydrationReport, profile?.defaultTargetMl, profile?.targetMl, thumblerData])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[1440px] max-h-[90vh] overflow-y-auto'>
        <DialogHeader className='text-start'>
          <DialogTitle>{t('users.view.dialog.title', 'User Details')}</DialogTitle>
          <DialogDescription>{headerSubtitle}</DialogDescription>
        </DialogHeader>

        <div className='space-y-4'>
          <DetailAccordionSection
            id='overview'
            title={t('users.view.sections.overview.title', 'Account Overview')}
            description={t(
              'users.view.sections.overview.description',
              'Profile, status, and engagement stats.'
            )}
            isOpen={openSection === 'overview'}
            onToggle={handleToggleSection}
          >
            <div className='space-y-4'>
              {error instanceof Error ? (
                <div className='rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive'>
                  {error.message}
                </div>
              ) : null}

              <div className={`grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3 ${profile ? "hidden" : "grid"}`}>
                <DisplayField
                  label={`${t('users.view.fields.username', 'UserName')}`}
                  value={canonicalDisplayName ?? '-'}
                  isLoading={isPending}
                  skeletonWidth='w-32'
                />
                <DisplayField
                  label={`${t('users.view.fields.email', 'Email')}`}
                  value={detail?.email ?? currentRow?.email ?? '-'}
                  isLoading={isPending}
                  skeletonWidth='w-40'
                />
                <DisplayField
                  label={`${t('users.view.fields.status', 'Status')}`}
                  value={detail?.status ?? '-'}
                  isLoading={isPending}
                  skeletonWidth='w-16'
                />
                <DisplayField
                  label={`${t('users.view.fields.emailVerified', 'Email Verified')}`}
                  value={emailVerified}
                  isLoading={isPending}
                  skeletonWidth='w-24'
                />
              </div>

              {profile ? (
                <>
                  {/* <div className='mt-2 text-sm font-semibold text-muted-foreground'>
                    Profile
                  </div> */}
                  <div className='grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3'>
                    {profileDisplayFields.map(({ label, value }) => (
                      <DisplayField
                        key={label}
                        label={label}
                        value={value}
                        isLoading={isPending}
                        skeletonWidth='w-28'
                      />
                    ))}
                  </div>
                </>
              ) : null}
            </div>
          </DetailAccordionSection>

          <DetailAccordionSection
            id='hydration'
            title={t('users.view.sections.hydration.title', 'Hydration Insights')}
            description={t(
              'users.view.sections.hydration.description',
              'Daily progress, history, and daily logs.'
            )}
            isOpen={openSection === 'hydration'}
            onToggle={handleToggleSection}
          >
        {hydrationOverview ? (
          <Card className='border border-border/60 bg-card/60'>
            <CardHeader className='flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between'>
              <div>
                <CardTitle>{t('users.view.hydration.daily.title', 'Daily Hydration')}</CardTitle>
                <CardDescription>
                  {hydrationOverview.date
                    ? format(hydrationOverview.date, 'EEEE, dd MMM yyyy')
                    : t(
                        'users.view.hydration.daily.description',
                        'Most recent synced hydration detail'
                      )}
                </CardDescription>
              </div>
              <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-3'>
                <span className='text-sm font-medium text-muted-foreground'>
                  {hydrationOverview.isTargetMet
                    ? t('users.view.hydration.daily.targetAchieved', 'Target achieved')
                    : t('users.view.hydration.daily.progress', '{percentage}% of target').replace(
                        '{percentage}',
                        String(Math.round(hydrationOverview.percentage * 100))
                      )}
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
                <SelectValue placeholder={t('users.view.controls.weekly', 'Weekly')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='weekly'>
                  {t('users.view.controls.weekly', 'Weekly')}
                </SelectItem>
                <SelectItem value='monthly'>
                  {t('users.view.controls.monthly', 'Monthly')}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        <div className='flex flex-wrap items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground'>
            <span>{t('users.view.controls.range', 'Range')}</span>
            <Input
              type='date'
              value={dateRange.start ?? ''}
              onChange={(event) =>
                setDateRange((prev) => ({ ...prev, start: event.target.value || undefined }))
              }
              className='h-8 w-[160px] text-xs'
            />
            <span className='text-muted-foreground'>{t('users.view.controls.to', 'to')}</span>
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
              {t('common.clear', 'Clear')}
            </Button>
          </div>
        </div>

        {(hydrationSummary || reportPeriod || weeklyProgressList.length) ? (
          <div className='grid grid-cols-1 gap-4 lg:grid-cols-2'>
            {(hydrationSummary || reportPeriod) ? (
              <Card className='border border-border/60 bg-card/60'>
                <CardHeader className='flex justify-between w-full'>
                  <div className=''>
                    <CardTitle>
                      {t('users.view.hydration.summary.title', 'Hydration Summary')}
                    </CardTitle>
                    <CardDescription>
                      {reportPeriod ??
                        t(
                          'users.view.hydration.summary.description',
                          'Aggregated metrics based on the selected range.'
                        )}
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className='grid grid-cols-2 gap-3 text-sm md:grid-cols-3'>
                    {reportTypeLabel ? (
                      <div className='rounded-md border border-border/50 bg-muted/20 p-3'>
                        <p className='text-xs uppercase text-muted-foreground'>
                          {t('users.view.hydration.summary.type', 'Type')}
                        </p>
                        <p className='font-semibold capitalize'>{reportTypeLabel}</p>
                      </div>
                    ) : null}
                    {hydrationSummary ? (
                      <>
                        <SummaryStat
                          label={t('users.view.hydration.summary.avgIntake', 'Avg Intake')}
                          value={`${getNumberField(hydrationSummary, ['avg_intake_ml']) ?? 0} ml`}
                        />
                        <SummaryStat
                          label={t('users.view.hydration.summary.avgSuccess', 'Avg Success')}
                          value={`${getNumberField(hydrationSummary, ['avg_success_rate']) ?? 0}%`}
                        />
                        <SummaryStat
                          label={t('users.view.hydration.summary.dayStreak', 'Day Streak')}
                          value={t('users.view.hydration.summary.dayStreakValue', '{count} days').replace(
                            '{count}',
                            String(getNumberField(hydrationSummary, ['day_streak']) ?? 0)
                          )}
                        />
                        <SummaryStat
                          label={t('users.view.hydration.summary.notifications', 'Notifications')}
                          value={getStringField(hydrationSummary, ['notification_display']) ?? '0/0'}
                        />
                      </>
                    ) : null}
                    {hydrationSummaryMeta ? (
                      <>
                        <SummaryStat
                          label={t('users.view.hydration.summary.totalIntake', 'Total Intake')}
                          value={`${getNumberField(hydrationSummaryMeta, ['sumIntakeMl']) ?? 0} ml`}
                        />
                        <SummaryStat
                          label={t('users.view.hydration.summary.totalSuccess', 'Total Success')}
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
                  <CardTitle>
                    {t('users.view.hydration.weekly.title', 'Weekly Progress')}
                  </CardTitle>
                  <CardDescription>
                    {t(
                      'users.view.hydration.weekly.description',
                      'Daily completion rate across the selected period.'
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent className='grid grid-cols-2 gap-3 text-sm md:grid-cols-3'>
                  {weeklyProgressList.map((dayData, index) => {
                    const dayLabel =
                      getStringField(dayData, ['day']) ??
                      t('users.view.hydration.weekly.dayLabel', 'Day {number}').replace(
                        '{number}',
                        String(index + 1)
                      )
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

        {todayDrinkLogs.length ? (
          <Card className='border border-border/60 bg-card/60'>
            <CardHeader>
              <CardTitle>{t('users.view.hydration.logs.title', "Today's Drink Logs")}</CardTitle>
              <CardDescription>
                {t(
                  'users.view.hydration.logs.description',
                  'Latest entries synced for the current day.'
                )}
              </CardDescription>
            </CardHeader>
            <CardContent className='overflow-x-auto'>
              <Table>
                <TableHeader>
                  <TableRow>
                  <TableHead>{t('users.view.hydration.logs.clientTime', 'Client Time')}</TableHead>
                    <TableHead>{t('users.view.hydration.logs.serverTime', 'Server Time')}</TableHead>
                    <TableHead className='text-right'>
                      {t('users.view.hydration.logs.intake', 'Intake')}
                    </TableHead>
                    <TableHead className='text-right'>
                      {t('users.view.hydration.logs.target', 'Target')}
                    </TableHead>
                    <TableHead className='text-right'>
                      {t('users.view.hydration.logs.cumulative', 'Cumulative')}
                    </TableHead>
                    <TableHead className='text-right'>
                      {t('users.view.hydration.logs.progress', 'Progress')}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {todayDrinkLogs.slice(0, 8).map((log, index) => {
                    const clientTime = getStringField(log, ['client_time', 'time'])
                    const serverTime = getStringField(log, ['server_time', 'created_at'])
                    const intake = getNumberField(log, ['intake_ml', 'intake', 'volume_ml'])
                    const target = getNumberField(log, ['target_ml'])
                    const cumulative = getNumberField(log, ['cummulative_ml', 'cumulative_ml'])
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
                          {cumulative !== undefined ? `${cumulative} ml` : '—'}
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
                  {drinkHistory.length ? (
            <Card className='border border-border/60 bg-card/60'>
              <CardHeader className='flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between'>
                <div>
                  <CardTitle>
                    {t('users.view.hydration.breakdown.title', 'Daily Breakdown')}
                  </CardTitle>
                  <CardDescription>
                    {t(
                      'users.view.hydration.breakdown.description',
                      'Insights from recent hydration achievements.'
                    )}
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
                        <TableHead>Progress</TableHead>
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
                            {entry.total.toLocaleString()}{' '}
                            <span className='text-xs text-muted-foreground'>ml</span>
                          </TableCell>
                          <TableCell>
                            <div className='flex items-center gap-2'>
                              <span className='font-semibold'>
                                {entry.percentage ?? 0}%
                              </span>
                              {entry.success ? (
                                <span className='text-xs font-medium text-emerald-600 dark:text-emerald-400'>
                                  {t('users.view.hydration.breakdown.targetMet', 'Target Met')}
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
          ) : (
            <Card className='border border-border/60 bg-card/60'>
              <CardHeader>
                <CardTitle>{t('users.view.hydration.breakdown.title', 'Daily Breakdown')}</CardTitle>
                <CardDescription>
                  {t(
                    'users.view.hydration.breakdown.empty',
                    'No historical records for the selected range.'
                  )}
                </CardDescription>
              </CardHeader>
            </Card>
          )}
          </DetailAccordionSection>

        {/* <DetailAccordionSection
          id='drinkHistory'
          title='Drink History'
          description='Aggregated progress for the selected range.'
          isOpen={openSection === 'drinkHistory'}
          onToggle={handleToggleSection}
        >

        </DetailAccordionSection> */}

        <DetailAccordionSection
            id='engagement'
            title={t('users.view.sections.engagement.title', 'Engagement & Controls')}
            description={t(
              'users.view.sections.engagement.description',
              'Alarm settings, relationships, and moderation history.'
            )}
            isOpen={openSection === 'engagement'}
            onToggle={handleToggleSection}
          >
            {(alarmSettingData ||
              followersAll.length ||
              followingList.length ||
              mutedUsersList.length ||
              blockedUsersList.length ||
              sentReportsList.length) ? (
              <div className='grid grid-cols-1 gap-4 lg:grid-cols-2'>
                {alarmSettingData ? (
                  <Card className='border border-border/60 bg-card/60'>
                    <CardHeader>
                      <CardTitle>
                        {t('users.view.engagement.alarm.title', 'Alarm Settings')}
                      </CardTitle>
                      <CardDescription>
                        {t(
                          'users.view.engagement.alarm.description',
                          'Most recent hydrated alarm configuration.'
                        )}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <dl className='space-y-2 text-sm'>
                        {Object.entries(alarmSettingData).map(([key, value]) => (
                          <div
                            key={key}
                            className='flex items-start justify-between gap-4 rounded-md border border-border/40 bg-muted/10 px-3 py-2'
                          >
                            <dt className='text-xs font-medium uppercase tracking-wide text-muted-foreground'>
                              {formatKeyLabel(key)}
                            </dt>
                            <dd
                              className='flex-1 text-right text-sm font-semibold flex flex-col items-end gap-1'
                              style={{
                                wordBreak: 'break-word',
                              }}
                            >
                              {renderAlarmValue(key, value, alarmValueLabels)}
                            </dd>
                          </div>
                        ))}
                      </dl>
                    </CardContent>
                  </Card>
                ) : null}

                {followerRows.length ? (
                  <Card className='border border-border/60 bg-card/60'>
                    <CardHeader>
                      <CardTitle>{t('users.view.engagement.followers.title', 'Followers')}</CardTitle>
                      <CardDescription>
                        {t(
                          'users.view.engagement.followers.description',
                          'Showing the latest {count} accepted followers'
                        ).replace('{count}', String(Math.min(followerRows.length, 8)))}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ul className='space-y-2 text-sm'>
                        {followerRows.slice(0, 8).map((row) => (
                          <li
                            key={row.id}
                            className='flex items-center gap-3 rounded-md border border-border/40 bg-muted/10 px-3 py-2'
                          >
                            <Avatar className='h-10 w-10'>
                              <AvatarImage src={row.user.avatarUrl ?? undefined} alt={row.user.primary} />
                              <AvatarFallback>{row.user.fallback}</AvatarFallback>
                            </Avatar>
                            <div className='flex flex-col'>
                              <span className='font-semibold'>{row.user.primary}</span>
                              {row.user.secondary ? (
                                <span className='text-xs text-muted-foreground'>{row.user.secondary}</span>
                              ) : null}
                              {row.context || row.followedAt ? (
                                <span className='text-xs text-muted-foreground'>
                                  {row.context ??
                                    t(
                                      'users.view.engagement.followers.statusAccepted',
                                      'Accepted'
                                    )}
                                  {row.followedAt ? ` • ${row.followedAt}` : null}
                                </span>
                              ) : null}
                            </div>
                          </li>
                        ))}
                        {followerRows.length > 8 ? (
                          <li className='text-xs text-muted-foreground'>
                            {t(
                              'users.view.engagement.followers.more',
                              '+{count} more accepted followers'
                            ).replace('{count}', String(followerRows.length - 8))}
                          </li>
                        ) : null}
                      </ul>
                    </CardContent>
                  </Card>
                ) : null}

                {/* {followingList.length ? ( */}
                  <Card className='border border-border/60 bg-card/60'>
                    <CardHeader>
                      <CardTitle>{t('users.view.engagement.friends.title', 'Friends')}</CardTitle>
                      <CardDescription>
                        {t(
                          'users.view.engagement.friends.description',
                          'Showing the latest {count} people they follow'
                        ).replace('{count}', String(Math.min(followingList.length, 8)))}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ul className='space-y-2 text-sm'>
                        {followingList.slice(0, 8).map((item, index) => {
                          const user = formatUserListItem(item)
                          return (
                            <li
                              key={`following-${user.primary}-${index}`}
                              className='flex items-center gap-3 rounded-md border border-border/40 bg-muted/10 px-3 py-2'
                            >
                              <Avatar className='h-10 w-10'>
                                <AvatarImage src={user.avatarUrl ?? undefined} alt={user.primary} />
                                <AvatarFallback>{user.fallback}</AvatarFallback>
                              </Avatar>
                              <div className='flex flex-col'>
                                <span className='font-semibold'>{user.primary}</span>
                                {user.secondary ? (
                                  <span className='text-xs text-muted-foreground'>{user.secondary}</span>
                                ) : null}
                              </div>
                            </li>
                          )
                        })}
                        {followingList.length > 8 ? (
                          <li className='text-xs text-muted-foreground'>
                            {t('users.view.engagement.friends.more', '+{count} more friends').replace(
                              '{count}',
                              String(followingList.length - 8)
                            )}
                          </li>
                        ) : null}
                      </ul>
                    </CardContent>
                  </Card>
                 {/* ) : null} */}

                {/* {UsersList.length ? (
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
                              className='flex items-center gap-3 rounded-md border border-border/40 bg-muted/10 px-3 py-2'
                            >
                              <Avatar className='h-10 w-10'>
                                <AvatarImage src={user.avatarUrl ?? undefined} alt={user.primary} />
                                <AvatarFallback>{user.fallback}</AvatarFallback>
                              </Avatar>
                              <div className='flex flex-col'>
                                <span className='font-semibold'>{user.primary}</span>
                                {user.secondary ? (
                                  <span className='text-xs text-muted-foreground'>{user.secondary}</span>
                                ) : null}
                              </div>
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
                ) : null} */}

                {blockedUsersList.length ? (
                  <Card className='border border-border/60 bg-card/60'>
                    <CardHeader>
                      <CardTitle>
                        {t('users.view.engagement.blocked.title', 'Blocked Users')}
                      </CardTitle>
                      <CardDescription>
                        {t(
                          'users.view.engagement.blocked.description',
                          'Accounts blocked by this user.'
                        )}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ul className='space-y-2 text-sm'>
                        {blockedUsersList.slice(0, 8).map((item, index) => {
                          const user = formatUserListItem(item)
                          return (
                            <li
                              key={`blocked-${user.primary}-${index}`}
                              className='flex items-center gap-3 rounded-md border border-border/40 bg-muted/10 px-3 py-2'
                            >
                              <Avatar className='h-10 w-10'>
                                <AvatarImage src={user.avatarUrl ?? undefined} alt={user.primary} />
                                <AvatarFallback>{user.fallback}</AvatarFallback>
                              </Avatar>
                              <div className='flex flex-col'>
                                <span className='font-semibold'>{user.primary}</span>
                                {user.secondary ? (
                                  <span className='text-xs text-muted-foreground'>{user.secondary}</span>
                                ) : null}
                              </div>
                            </li>
                          )
                        })}
                        {blockedUsersList.length > 8 ? (
                          <li className='text-xs text-muted-foreground'>
                            {t(
                              'users.view.engagement.blocked.more',
                              '+{count} more blocked users'
                            ).replace('{count}', String(blockedUsersList.length - 8))}
                          </li>
                        ) : null}
                      </ul>
                    </CardContent>
                  </Card>
                ) : null}

                {sentReportsList.length ? (
                  <Card className='border border-border/60 bg-card/60 lg:col-span-2'>
                    <CardHeader>
                      <CardTitle>{t('users.view.engagement.reports.title', 'Sent Reports')}</CardTitle>
                      <CardDescription>
                        {t(
                          'users.view.engagement.reports.description',
                          'Latest moderation reports filed by this user.'
                        )}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ul className='space-y-2 text-sm'>
                        {sentReportsList.slice(0, 6).map((entry, index) => {
                          const reason =
                            getStringField(entry, ['reason', 'category', 'type']) ??
                            t('users.view.engagement.reports.fallback', 'Report #{number}').replace(
                              '{number}',
                              String(index + 1)
                            )
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
                                <div className='text-xs text-muted-foreground'>
                                  {t('users.view.engagement.reports.target', 'Target: {name}').replace(
                                    '{name}',
                                    targetLabel
                                  )}
                                </div>
                              ) : null}
                              {createdAt ? (
                                <div className='text-xs text-muted-foreground'>
                                  {t('users.view.engagement.reports.filedAt', 'Filed {date}').replace(
                                    '{date}',
                                    createdAt
                                  )}
                                </div>
                              ) : null}
                            </li>
                          )
                        })}
                        {sentReportsList.length > 6 ? (
                          <li className='text-xs text-muted-foreground'>
                            {t(
                              'users.view.engagement.reports.more',
                              '+{count} additional reports'
                            ).replace('{count}', String(sentReportsList.length - 6))}
                          </li>
                        ) : null}
                      </ul>
                    </CardContent>
                  </Card>
                ) : null}
              </div>
            ) : (
              <p className='text-sm text-muted-foreground'>
                {t(
                  'users.view.engagement.empty',
                  'No engagement or moderation data available.'
                )}
              </p>
            )}
          </DetailAccordionSection>

          <DetailAccordionSection
            id='notifications'
            title={t('users.view.sections.notifications.title', 'Notifications')}
            description={t(
              'users.view.sections.notifications.description',
              'Follower activity and delivery logs.'
            )}
            isOpen={openSection === 'notifications'}
            onToggle={handleToggleSection}
          >
            {notificationSummary ||
            newFollowersList.length ||
            todayNotifications.length ||
            lastWeekNotifications.length ? (
              <Card className='border border-border/60 bg-card/60'>
                <CardHeader>
                  <CardTitle>{t('users.view.notifications.cardTitle', 'Notifications')}</CardTitle>
                  <CardDescription>
                    {t(
                      'users.view.notifications.cardDescription',
                      'Recent engagement and follower updates.'
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent className='space-y-6 text-sm'>
                  {newFollowersList.length ? (
                    <section>
                      <div className='mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground'>
                        {t('users.view.notifications.newFollowers', 'New Followers')}
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
                        {t('users.view.notifications.followerProgress', 'Follower Progress')}
                      </div>
                      <ul className='space-y-3'>
                        {dailyFollowerProgressList.slice(0, 5).map((item, index) => {
                          const follower = getRecordField(item, ['user'])
                          const user = formatUserListItem(follower ?? item)
                          const progress = getNumberField(item, ['progress_percentage'])
                          const timestamp = formatTimestamp(getStringField(item, ['created_at', 'updated_at']))
                          return (
                            <li
                              key={`progress-${user.primary}-${index}`}
                              className='flex items-center gap-3 rounded-md border border-border/40 bg-muted/10 px-3 py-2'
                            >
                              <FollowerProgressBadge progress={progress} user={user} />
                              <div className='flex flex-1 flex-col'>
                                <span className='font-semibold'>{user.primary}</span>
                                <span className='text-xs text-muted-foreground'>
                                  {progress !== undefined
                                    ? t(
                                        'users.view.notifications.hydrationProgress',
                                        '{value}% hydration progress'
                                      ).replace('{value}', String(clampPercentage(progress)))
                                    : t(
                                        'users.view.notifications.progressUnavailable',
                                        'Progress unavailable'
                                      )}
                                </span>
                                {timestamp ? (
                                  <span className='text-[10px] text-muted-foreground'>{timestamp}</span>
                                ) : null}
                              </div>
                            </li>
                          )
                        })}
                      </ul>
                    </section>
                  ) : null}

                  {todayNotifications.length ? (
                    <NotificationsListSection
                      title={t('users.view.notifications.today', 'Today')}
                      items={todayNotifications}
                      fallbackLabel={t(
                        'users.view.notifications.todayFallback',
                        'Today notification'
                      )}
                    />
                  ) : null}

                  {lastWeekNotifications.length ? (
                    <NotificationsListSection
                      title={t('users.view.notifications.lastWeek', 'Last Week')}
                      items={lastWeekNotifications}
                      fallbackLabel={t(
                        'users.view.notifications.lastWeekFallback',
                        'Last week notification'
                      )}
                    />
                  ) : null}

                  {!newFollowersList.length &&
                  !dailyFollowerProgressList.length &&
                  !todayNotifications.length &&
                  !lastWeekNotifications.length ? (
                    <p className='text-sm text-muted-foreground'>
                      {t('users.view.notifications.empty', 'No notification data available.')}
                    </p>
                  ) : null}
                </CardContent>
              </Card>
            ) : (
              <Card className='border border-border/60 bg-card/60'>
                <CardHeader>
                  <CardTitle>{t('users.view.notifications.cardTitle', 'Notifications')}</CardTitle>
                  <CardDescription>
                    {t(
                      'users.view.notifications.cardDescription',
                      'Recent engagement and follower updates.'
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className='text-sm text-muted-foreground'>
                    {t(
                      'users.view.notifications.empty',
                      'No notification data available.'
                    )}
                  </p>
                </CardContent>
              </Card>
            )}
          </DetailAccordionSection>
        </div>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>
            {t('common.close', 'Close')}
          </Button>
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
      const trimmed = raw.trim()
      if (['null', 'undefined', 'none'].includes(trimmed.toLowerCase())) {
        continue
      }
      return trimmed
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

function getFollowerStatus(entry: UnknownRecord | null | undefined): string | undefined {
  if (!entry) return undefined
  const pivot = getRecordField(entry, ['pivot', 'meta'])
  const candidate =
    getStringField(entry, ['status', 'relationship', 'relation', 'type', 'source', 'category']) ??
    getStringField(pivot ?? {}, ['status', 'relationship', 'relation', 'type', 'source', 'category'])

  return candidate?.trim().toLowerCase() || undefined
}

const ACCEPTED_FOLLOWER_STATUSES = new Set(['accept', 'accepted', 'approve', 'approved'])

function isAcceptedFollowerStatus(status?: string) {
  if (!status) return false
  return ACCEPTED_FOLLOWER_STATUSES.has(status.toLowerCase())
}

function formatFollowerContext(
  entry: UnknownRecord | null | undefined,
  statusHint?: string
): string | undefined {
  const normalizedStatus = statusHint ?? getFollowerStatus(entry)
  if (!normalizedStatus) return undefined

  return normalizedStatus
    .split(/[\s_]+/)
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ')
}

type FormattedUserListItem = {
  primary: string
  secondary?: string
  avatarUrl?: string | null
  fallback: string
}

function formatUserListItem(entry: UnknownRecord | null | undefined): FormattedUserListItem {
  if (!entry) {
    return { primary: 'Unknown user', fallback: 'UU' }
  }

  const profileRecord =
    getRecordField(entry, ['profile']) ??
    getRecordField(entry, ['user']) ??
    getRecordField(entry, ['target'])

  const profileUsername = profileRecord
    ? getStringField(profileRecord, ['username', 'name', 'full_name', 'display_name'])
    : undefined

  const entryUsername = getStringField(entry, ['username', 'name', 'email', 'title'])

  const primary =
    profileUsername ??
    entryUsername ??
    (typeof entry.id === 'string' || typeof entry.id === 'number'
      ? `User ${entry.id}`
      : 'Unknown user')

  const secondary =
    (profileRecord &&
      (getStringField(profileRecord, ['email']) ?? getStringField(profileRecord, ['role']))) ??
    getStringField(entry, ['email', 'pattern', 'role'])

  const avatarUrl =
    (profileRecord &&
      (getStringField(profileRecord, ['avatar_url', 'avatar', 'photo', 'image', 'picture']))) ??
    getStringField(entry, ['avatar_url', 'avatar', 'photo', 'image', 'picture'])

  const fallback = getInitials(primary)

  return { primary, secondary, avatarUrl, fallback }
}

type NotificationsListSectionProps = {
  title: string
  items: UnknownRecord[]
  fallbackLabel: string
}

function NotificationsListSection({
  title,
  items,
  fallbackLabel,
}: NotificationsListSectionProps) {
  if (!items.length) return null

  return (
    <section>
      <div className='mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground'>
        {title}
      </div>
      <ul className='space-y-2'>
        {items.slice(0, 5).map((item, index) => {
          const identifier =
            getStringField(item, ['id']) ?? getStringField(item, ['uuid']) ?? `${fallbackLabel}-${index}`
          return (
            <NotificationListItem
              key={identifier}
              entry={item}
              fallbackTitle={`${fallbackLabel} #${index + 1}`}
            />
          )
        })}
      </ul>
    </section>
  )
}

type NotificationListItemProps = {
  entry: UnknownRecord
  fallbackTitle: string
}

function NotificationListItem({ entry, fallbackTitle }: NotificationListItemProps) {
  const payload = getRecordField(entry, ['data'])
  const actorRecord = getRecordField(entry, ['user']) ?? (payload ? getRecordField(payload, ['user']) : undefined)
  const actor = formatUserListItem(actorRecord ?? entry)

  const senderName =
    getStringField(payload ?? {}, ['sender_name', 'senderName', 'sender']) ?? undefined

  const displayName = senderName && senderName.trim().length > 0 ? senderName.trim() : actor.primary

  const rawMessage =
    getStringField(payload ?? {}, ['message', 'content']) ??
    getStringField(entry, ['pattern', 'title', 'message', 'content']) ??
    fallbackTitle

  const message = rawMessage.trim().length > 0 ? rawMessage.trim() : fallbackTitle

  const timestamp =
    formatTimestamp(
      getStringField(entry, ['created_at', 'timestamp', 'time']) ??
        getStringField(payload ?? {}, ['created_at', 'time'])
    ) ?? undefined

  const typeHint =
    getStringField(payload ?? {}, ['type']) ?? getStringField(entry, ['type'])

  const iconHint = getNotificationIconHint(message, typeHint)

  return (
    <li className='flex items-center gap-3 rounded-md border border-border/40 bg-muted/10 px-3 py-2'>
      <Avatar className='h-12 w-12 border border-border/50 bg-background'>
        <AvatarImage src={actor.avatarUrl ?? undefined} alt={actor.primary} />
        <AvatarFallback>{actor.fallback}</AvatarFallback>
      </Avatar>
      <div className='flex flex-1 flex-col'>
        <p className='text-sm leading-tight'>
          <span className='font-semibold'>{displayName}</span>{' '}
          <span className='text-muted-foreground'>{message}</span>
        </p>
        {timestamp ? (
          <span className='text-xs text-muted-foreground'>{timestamp}</span>
        ) : null}
      </div>
      <span className='text-xs font-medium text-muted-foreground whitespace-nowrap'>
        {iconHint}
      </span>
    </li>
  )
}

type FollowerProgressBadgeProps = {
  progress?: number
  user: FormattedUserListItem
}

function FollowerProgressBadge({ progress, user }: FollowerProgressBadgeProps) {
  const normalized = clampPercentage(progress)
  const angle = (normalized / 100) * 360
  const progressColor = 'var(--primary)'
  const trackColor = 'var(--muted)'

  return (
    <div className='relative h-14 w-14'>
      <div
        className='absolute inset-0 rounded-full border border-border/40'
        style={{
          background: `conic-gradient(${progressColor} ${angle}deg, ${trackColor} ${angle}deg 360deg)`,
        }}
        aria-hidden='true'
      />
      <div className='absolute inset-1 rounded-full bg-background flex items-center justify-center'>
        <Avatar className='h-full w-full border border-border/40'>
          <AvatarImage src={user.avatarUrl ?? undefined} alt={user.primary} />
          <AvatarFallback>{user.fallback}</AvatarFallback>
        </Avatar>
      </div>
      <span className='absolute -bottom-1 left-1/2 -translate-x-1/2 rounded-full border border-border/40 bg-background px-1 text-[10px] font-semibold text-muted-foreground'>
        {normalized}%
      </span>
    </div>
  )
}

function formatKeyLabel(key: string): string {
  return key
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

function formatMeasurement(value?: number | null, unit?: string) {
  if (typeof value === 'number' && !Number.isNaN(value)) {
    return unit ? `${value} ${unit}` : `${value}`
  }
  return '-'
}

function formatProfileDate(value?: string | null) {
  if (!value) return '-'
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return value
  }
  return format(parsed, 'dd MMM yyyy')
}

function ProfileColorSwatch({ color, label }: { color: string; label: string }) {
  const normalized = color?.trim() || '#000000'
  return (
    <span className='inline-flex items-center gap-2'>
      <span
        className='h-4 w-4 rounded-full border border-border/60'
        style={{ backgroundColor: normalized }}
        aria-label={label}
      />
      {normalized}
    </span>
  )
}

const DEFAULT_AVATAR_SRC = '/avatars/shadcn.jpg'

function ProfileAvatarPreview({
  src,
  fallback,
  openLabel,
  defaultLabel,
}: {
  src?: string | null
  fallback: string
  openLabel: string
  defaultLabel: string
}) {
  const imageSrc = src && src.trim().length > 0 ? src : DEFAULT_AVATAR_SRC
  const initials = getInitials(fallback)
  return (
    <div className='flex items-center gap-3'>
      <Avatar className='h-10 w-10'>
        <AvatarImage src={imageSrc} alt={fallback} />
        <AvatarFallback>{initials}</AvatarFallback>
      </Avatar>
      <div className='flex flex-col text-sm'>
        <span>{fallback}</span>
        {src && src.trim().length > 0 ? (
          <a
            href={src}
            target='_blank'
            rel='noreferrer'
            className='text-xs text-primary underline decoration-dotted'
          >
            {openLabel}
          </a>
        ) : (
          <span className='text-xs text-muted-foreground'>{defaultLabel}</span>
        )}
      </div>
    </div>
  )
}

type AlarmValueLabels = {
  empty: string
  enabled: string
  disabled: string
}

function renderAlarmValue(
  key: string,
  value: unknown,
  labels: AlarmValueLabels
): ReactNode {
  const normalizedKey = key.toLowerCase()
  const renderInline = (text: string) => (
    <span className='inline-flex w-full justify-end text-right'>{text}</span>
  )

  if (Array.isArray(value) && normalizedKey === 'times') {
    const times = value
      .map((entry) => {
        if (entry === null || typeof entry === 'undefined') return null
        if (typeof entry === 'string' || typeof entry === 'number') {
          const trimmed = String(entry).trim()
          return trimmed.length > 0 ? trimmed : null
        }
        return null
      })
      .filter((entry): entry is string => Boolean(entry))

    if (!times.length) {
      return renderInline(labels.empty)
    }

    return (
      <div className='grid w-full grid-cols-3 gap-1 justify-items-end'>
        {times.map((time, index) => (
          <span
            key={`${time}-${index}`}
            className='w-full rounded-md border border-border/40 bg-muted/50 px-2 py-0.5 text-center text-xs font-semibold text-foreground'
          >
            {time}
          </span>
        ))}
      </div>
    )
  }

  if (typeof value === 'string') {
    const formattedDate = formatAlarmDate(value)
    if (formattedDate) {
      return renderInline(formattedDate)
    }
    return renderInline(value)
  }

  return renderInline(formatValueDisplay(value, labels))
}

function formatAlarmDate(value: string): string | null {
  if (!/[T/-]/.test(value)) {
    return null
  }
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return null
  }
  return format(parsed, 'dd MMM yyyy')
}

function getInitials(value: string): string {
  const trimmed = value?.trim()
  if (!trimmed) return 'UU'
  const parts = trimmed.split(/\s+/).filter(Boolean)
  if (parts.length === 0) return 'UU'
  const initials = parts
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('')
  return initials || 'UU'
}

function formatValueDisplay(value: unknown, labels: AlarmValueLabels): string {
  if (value === null || typeof value === 'undefined') return labels.empty
  if (typeof value === 'boolean') return value ? labels.enabled : labels.disabled
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
    return formatted.length ? formatted.join(', ') : labels.empty
  }
  return JSON.stringify(value)
}

function clampPercentage(value?: number | null): number {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return 0
  }
  const scaled = value <= 1 && value >= 0 ? value * 100 : value
  return Math.max(0, Math.min(Math.round(scaled), 100))
}

function getNotificationIconHint(message: string, type?: string | null): ReactNode {
  const loweredType = type?.toLowerCase() ?? ''
  const text = message.toLowerCase()
  if (loweredType.includes('friend') || loweredType.includes('follow') || text.includes('friend') || text.includes('request')) {
    return (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M15.499 6C12.7078 6 10.4386 8.13012 10.4386 10.7503C10.4386 13.3204 12.58 15.4005 15.3712 15.4905C15.4564 15.4805 15.5416 15.4805 15.6055 15.4905C15.6268 15.4905 15.6375 15.4905 15.6588 15.4905C15.6695 15.4905 15.6695 15.4905 15.6801 15.4905C18.4074 15.4005 20.5487 13.3204 20.5594 10.7503C20.5594 8.13012 18.2902 6 15.499 6Z" fill="url(#paint0_linear_2256_5059)"/>
        <path d="M20.9119 18.1496C17.9396 16.2895 13.0923 16.2895 10.0987 18.1496C8.74574 18.9996 8 20.1497 8 21.3797C8 22.6098 8.74574 23.7499 10.0881 24.5899C11.5795 25.53 13.5398 26 15.5 26C17.4602 26 19.4205 25.53 20.9119 24.5899C22.2543 23.7399 23 22.5998 23 21.3597C22.9893 20.1297 22.2543 18.9896 20.9119 18.1496ZM17.6307 22.1298H16.299V23.3799C16.299 23.7899 15.9368 24.1299 15.5 24.1299C15.0632 24.1299 14.701 23.7899 14.701 23.3799V22.1298H13.3693C12.9325 22.1298 12.5703 21.7898 12.5703 21.3797C12.5703 20.9697 12.9325 20.6297 13.3693 20.6297H14.701V19.3796C14.701 18.9696 15.0632 18.6296 15.5 18.6296C15.9368 18.6296 16.299 18.9696 16.299 19.3796V20.6297H17.6307C18.0675 20.6297 18.4297 20.9697 18.4297 21.3797C18.4297 21.7898 18.0675 22.1298 17.6307 22.1298Z" fill="url(#paint1_linear_2256_5059)"/>
        <defs>
        <linearGradient id="paint0_linear_2256_5059" x1="15.5" y1="6" x2="15.5" y2="26" gradientUnits="userSpaceOnUse">
        <stop stop-color="#BCBCBC"/>
        <stop offset="1" stop-color="#CCCCCC"/>
        </linearGradient>
        <linearGradient id="paint1_linear_2256_5059" x1="15.5" y1="6" x2="15.5" y2="26" gradientUnits="userSpaceOnUse">
        <stop stop-color="#BCBCBC"/>
        <stop offset="1" stop-color="#CCCCCC"/>
        </linearGradient>
        </defs>
      </svg>

    )
  }
  if (loweredType.includes('drink') || text.includes('ml') || text.includes('drink') || text.includes('water')) {
    return (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M24 18.2222C24 22.9269 20.8391 26 16 26C11.1609 26 8 22.9269 8 18.2222C8 14.4925 13.0279 8.99496 15.1117 6.87659C15.6056 6.37456 16.3944 6.37456 16.8883 6.87659C18.9721 8.99496 24 14.4925 24 18.2222Z" fill="url(#paint0_linear_2256_5069)"/>
        <defs>
        <linearGradient id="paint0_linear_2256_5069" x1="16" y1="6" x2="16" y2="26" gradientUnits="userSpaceOnUse">
        <stop stop-color="#E1EFFF"/>
        <stop offset="1" stop-color="#B4D7FF"/>
        </linearGradient>
        </defs>
      </svg>
    )
  }
  if (loweredType.includes('goal') || text.includes('goal') || text.includes('target')) {
    return (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M10.8115 8.13965C10.7716 6.0898 12.1015 5.39012 13.7715 6.58008L16.8516 8.7998C17.2716 9.1097 18.0216 9.21955 18.5215 9.05957L21.4717 8.08984C23.3614 7.47012 24.421 8.52005 23.8311 10.4199L22.8115 13.6602C22.6416 14.2002 22.8117 14.9997 23.1816 15.4297L25.1611 17.7295C26.7211 19.5495 26.0413 20.9295 23.6514 20.8096L20.3115 20.6396C19.7115 20.6096 18.9509 20.9996 18.6309 21.5195L16.8711 24.3701C15.6111 26.4098 14.0914 26.1793 13.4814 23.8594L12.7109 20.9199C12.5709 20.3699 12.0009 19.7794 11.4609 19.6094L8.23145 18.5996C6.33152 17.9996 6.07133 16.5301 7.66113 15.3301L10.1416 13.4502C10.5616 13.1402 10.8909 12.4497 10.8809 11.9297L10.8115 8.13965ZM9.69141 21.4404C9.98141 21.1504 10.461 21.1504 10.751 21.4404C11.0409 21.7304 11.0409 22.21 10.751 22.5L7.72168 25.5303C7.57173 25.6802 7.38134 25.75 7.19141 25.75C7.00146 25.75 6.81111 25.6802 6.66113 25.5303C6.37113 25.2403 6.37113 24.7597 6.66113 24.4697L9.69141 21.4404ZM19.627 12.8975C19.2945 12.6067 18.789 12.6412 18.498 12.9736L15.5996 16.2852L14.1025 14.5732C13.8117 14.2408 13.3061 14.2073 12.9736 14.498C12.6412 14.7889 12.6067 15.2944 12.8975 15.627L14.998 18.0264C15.1499 18.1999 15.3691 18.2997 15.5996 18.2998C15.8303 18.2998 16.0502 18.2 16.2021 18.0264L19.7021 14.0264C19.9928 13.6939 19.9593 13.1883 19.627 12.8975Z" fill="url(#paint0_linear_2256_5099)"/>
        <defs>
        <linearGradient id="paint0_linear_2256_5099" x1="6.44336" y1="6" x2="26.4435" y2="25.9999" gradientUnits="userSpaceOnUse">
        <stop stop-color="#6BC691"/>
        <stop offset="1" stop-color="#EEEEEE"/>
        </linearGradient>
        </defs>
      </svg>

    )
  }
  if (loweredType.includes('signal') || text.includes('signal')) {
    return (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="32" height="32" fill="white"/>
        <path d="M25.4842 20.597C25.381 20.597 25.2842 20.5647 25.1939 20.5002C24.981 20.3389 24.9358 20.0357 25.0971 19.8228C25.8778 18.784 26.2907 17.5453 26.2907 16.2421C26.2907 14.9389 25.8778 13.7002 25.0971 12.6615C24.9358 12.4486 24.981 12.1453 25.1939 11.984C25.4068 11.8228 25.71 11.8679 25.8713 12.0808C26.781 13.2873 27.2584 14.726 27.2584 16.2421C27.2584 17.7582 26.781 19.197 25.8713 20.4034C25.7745 20.5324 25.6326 20.597 25.4842 20.597Z" fill="#8BE4B0"/>
        <path d="M23.4197 19.0482C23.3165 19.0482 23.2197 19.0159 23.1294 18.9514C22.9165 18.7901 22.8713 18.4869 23.0326 18.274C23.4778 17.6869 23.71 16.9837 23.71 16.2417C23.71 15.4998 23.4778 14.7966 23.0326 14.2095C22.8713 13.9966 22.9165 13.6933 23.1294 13.5321C23.3423 13.3708 23.6455 13.4159 23.8068 13.6288C24.3745 14.3901 24.6778 15.2933 24.6778 16.2417C24.6778 17.1901 24.3745 18.0998 23.8068 18.8546C23.71 18.9837 23.5681 19.0482 23.4197 19.0482Z" fill="#56D38B"/>
        <path d="M6.77419 20.597C6.62581 20.597 6.48387 20.5324 6.3871 20.4034C5.47742 19.197 5 17.7582 5 16.2421C5 14.726 5.47742 13.2873 6.3871 12.0808C6.54839 11.8679 6.85161 11.8228 7.06452 11.984C7.27742 12.1453 7.32258 12.4486 7.16129 12.6615C6.38065 13.7002 5.96774 14.9389 5.96774 16.2421C5.96774 17.5453 6.38065 18.784 7.16129 19.8228C7.32258 20.0357 7.27742 20.3389 7.06452 20.5002C6.98064 20.5647 6.87742 20.597 6.77419 20.597Z" fill="#8BE4B0"/>
        <path d="M8.83871 19.0482C8.69032 19.0482 8.54839 18.9837 8.45161 18.8546C7.88387 18.0998 7.58065 17.1901 7.58065 16.2417C7.58065 15.2933 7.88387 14.3837 8.45161 13.6288C8.6129 13.4159 8.91613 13.3708 9.12903 13.5321C9.34194 13.6933 9.3871 13.9966 9.22581 14.2095C8.78064 14.7966 8.54839 15.4998 8.54839 16.2417C8.54839 16.9837 8.78064 17.6869 9.22581 18.274C9.3871 18.4869 9.34194 18.7901 9.12903 18.9514C9.04516 19.0159 8.94194 19.0482 8.83871 19.0482Z" fill="#56D38B"/>
        <path d="M10.9679 24.1452H21.2905V26.0806H10.9679V24.1452Z" fill="url(#paint0_linear_2256_5089)"/>
        <path d="M10.9679 25.9194H21.2905V27.5176C21.2905 27.8395 21.052 28.1127 20.7328 28.1546C17.2249 28.6151 15.0335 28.6151 11.5256 28.1546C11.2064 28.1127 10.9679 27.8395 10.9679 27.5176V25.9194Z" fill="#EEEEEE"/>
        <path d="M10.9679 4.59998C10.9679 4.30853 11.1624 4.05204 11.4463 3.98623C14.2432 3.33792 18.0152 3.33792 20.8121 3.98623C21.096 4.05204 21.2905 4.30853 21.2905 4.59998V6.56452C21.2905 6.92083 21.0016 7.20968 20.6453 7.20968H11.6131C11.2568 7.20968 10.9679 6.92083 10.9679 6.56452V4.59998Z" fill="#EEEEEE"/>
        <path d="M10.9679 8.5C10.9679 8.14369 11.2568 7.85484 11.6131 7.85484H20.6453C21.0016 7.85484 21.2905 8.14369 21.2905 8.5V24.629H10.9679V8.5Z" fill="#EEEEEE"/>
        <defs>
        <linearGradient id="paint0_linear_2256_5089" x1="5.90712" y1="28.5" x2="30.4096" y2="8.46268" gradientUnits="userSpaceOnUse">
        <stop stop-color="#E7E8E8"/>
        <stop offset="1" stop-color="#CCCCCC"/>
        </linearGradient>
        </defs>
      </svg>
    )
  }
  if (loweredType.includes('vibration') || text.includes('vibration') || text.includes('motion')) {
    return (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M11 23.8268H21.4134V25.7794H11V23.8268Z" fill="url(#paint0_linear_2256_5079)"/>
        <path d="M11 25.6166H21.4134V27.2289C21.4134 27.5537 21.1728 27.8293 20.8508 27.8716C17.312 28.3361 15.1014 28.3361 11.5626 27.8716C11.2406 27.8293 11 27.5537 11 27.2289V25.6166Z" fill="#EEEEEE"/>
        <path d="M11 4.10966C11 3.81565 11.1962 3.5569 11.4826 3.49051C14.3041 2.8365 18.1093 2.8365 20.9308 3.49051C21.2172 3.5569 21.4134 3.81565 21.4134 4.10966V6.09148C21.4134 6.45093 21.122 6.74232 20.7626 6.74232H11.6508C11.2914 6.74232 11 6.45093 11 6.09148V4.10966Z" fill="#EEEEEE"/>
        <path d="M11 8.044C11 7.68455 11.2914 7.39316 11.6508 7.39316H20.7626C21.122 7.39316 21.4134 7.68455 21.4134 8.044V24.315H11V8.044Z" fill="#EEEEEE"/>
        <defs>
        <linearGradient id="paint0_linear_2256_5079" x1="11.4244" y1="28.22" x2="28.1483" y2="21.8775" gradientUnits="userSpaceOnUse">
        <stop stop-color="#6DD893"/>
        <stop offset="1" stop-color="#76BAEE"/>
        </linearGradient>
        </defs>
      </svg>
    )
  }
  return 'general'
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

type DetailAccordionSectionProps = {
  id: DetailSectionKey
  title: string
  description?: string
  isOpen: boolean
  onToggle: (id: DetailSectionKey, open: boolean) => void
  children: ReactNode
}

function DetailAccordionSection({
  id,
  title,
  description,
  isOpen,
  onToggle,
  children,
}: DetailAccordionSectionProps) {
  return (
    <Collapsible open={isOpen} onOpenChange={(open) => onToggle(id, open)}>
      <div className='rounded-xl border border-border/60 bg-card/60 shadow-sm'>
        <CollapsibleTrigger
          className='flex w-full items-center justify-between gap-3 px-4 py-3 text-left'
          type='button'
        >
          <div className='space-y-1'>
            <p className='text-sm font-semibold'>{title}</p>
            {description ? (
              <p className='text-xs text-muted-foreground'>{description}</p>
            ) : null}
          </div>
          <ChevronDown
            className={cn(
              'h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200',
              isOpen ? 'rotate-180' : ''
            )}
          />
        </CollapsibleTrigger>
        <CollapsibleContent className='border-t border-border/60'>
          <div className='space-y-4 px-4 py-4'>{children}</div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  )
}
