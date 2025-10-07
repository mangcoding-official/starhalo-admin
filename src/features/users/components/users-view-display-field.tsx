export function DisplayField({ label, value }: { label: string; value: string }) {
  return (
    <div className='grid grid-cols-3 items-center gap-x-4'>
      <div className='text-sm text-muted-foreground col-span-1 text-end pr-2'>{label}</div>
      <div className='col-span-2'>
        <div className='rounded-md border px-3 py-2 bg-muted/30'>{value}</div>
      </div>
    </div>
  )
}
