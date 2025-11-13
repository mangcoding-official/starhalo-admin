import type { ReactNode } from 'react'
import { Skeleton } from '@/components/ui/skeleton'

type DisplayFieldProps = {
  label: string
  value: ReactNode
  isLoading?: boolean
  skeletonWidth?: string
}

export function DisplayField({ label, value, isLoading = false, skeletonWidth = 'w-24' }: DisplayFieldProps) {
  const isEmpty = value === undefined || value === null || value === ''
  const content = isEmpty ? '-' : value

  return (
    <div className='grid grid-cols-3 items-center gap-x-4'>
      <div className='text-sm text-muted-foreground col-span-1 text-end pr-2'>{label}</div>
      <div className='col-span-2'>
        <div className='rounded-md border px-3 py-2 bg-muted/30 break-words'>
          {isLoading ? <Skeleton className={`h-5 ${skeletonWidth}`} /> : content}
        </div>
      </div>
    </div>
  )
}
