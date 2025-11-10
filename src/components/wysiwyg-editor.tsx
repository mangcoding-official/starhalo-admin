import { useCallback, useEffect, useMemo, useRef } from 'react'
import type QuillType from 'quill'
import type { Range } from 'quill'
import type Toolbar from 'quill/modules/toolbar'
import type { ToolbarConfig } from 'quill/modules/toolbar'
import 'quill/dist/quill.snow.css'
import { cn } from '@/lib/utils'

export interface WysiwygEditorProps {
  value?: string
  placeholder?: string
  disabled?: boolean
  className?: string
  onChange: (value: string) => void
  onBlur?: () => void
}

const TOOLBAR_OPTIONS: ToolbarConfig = [
  [{ header: [1, 2, 3, false] }],
  ['bold', 'italic', 'underline', 'strike'],
  [{ color: [] }, { background: [] }],
  [{ list: 'ordered' }, { list: 'bullet' }],
  [{ align: [] }],
  ['link', 'image'],
  ['clean'],
]

function sanitizeHtml(value: string | undefined | null) {
  if (!value) return ''
  return value.replace(/<script.*?>[\s\S]*?<\/script>/gi, '')
}

function areHtmlContentsEqual(a: string, b: string) {
  const normalize = (input: string) =>
    input
      .replace(/&nbsp;/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim()
  return normalize(a) === normalize(b)
}

function toPlainText(html: string) {
  return html
    .replace(/<style.*?>[\s\S]*?<\/style>/gi, '')
    .replace(/<script.*?>[\s\S]*?<\/script>/gi, '')
    .replace(/<\/(p|div|br)>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function WysiwygEditor({
  value,
  placeholder,
  disabled,
  className,
  onChange,
  onBlur,
}: WysiwygEditorProps) {
  const wrapperRef = useRef<HTMLDivElement | null>(null)
  const quillRef = useRef<QuillType | null>(null)
  const latestHtmlRef = useRef<string>(sanitizeHtml(value))
  const textChangeHandlerRef = useRef<(() => void) | null>(null)
  const selectionChangeHandlerRef = useRef<
    ((range: Range | null, oldRange: Range | null, source: unknown) => void) | null
  >(null)
  const onChangeRef = useRef(onChange)
  const onBlurRef = useRef(onBlur)
  const disabledRef = useRef(Boolean(disabled))

  useEffect(() => {
    onChangeRef.current = onChange
  }, [onChange])

  useEffect(() => {
    onBlurRef.current = onBlur
  }, [onBlur])

  useEffect(() => {
    disabledRef.current = Boolean(disabled)
  }, [disabled])

  const sanitizedValue = useMemo(() => sanitizeHtml(value), [value])
  const plainText = useMemo(() => toPlainText(sanitizedValue), [sanitizedValue])

  const handleImageUpload = useCallback((quill: QuillType) => {
    if (disabledRef.current) return

    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = () => {
      const file = input.files?.[0]
      if (!file) return

      const reader = new FileReader()
      reader.onload = () => {
        const base64 = reader.result
        if (typeof base64 !== 'string') return

        const range = quill.getSelection(true)
        const index = range ? range.index : quill.getLength()
        quill.insertEmbed(index, 'image', base64, 'user')
        quill.setSelection(index + 1)
      }
      reader.readAsDataURL(file)
    }
    input.click()
  }, [])

  useEffect(() => {
    let isCancelled = false

    async function initialize() {
      if (!wrapperRef.current || quillRef.current) return

      const { default: Quill } = await import('quill')
      if (isCancelled || !wrapperRef.current || quillRef.current) return

      const quill = new Quill(wrapperRef.current, {
        theme: 'snow',
        modules: {
          toolbar: TOOLBAR_OPTIONS,
          clipboard: { matchVisual: true },
        },
        placeholder,
        readOnly: disabledRef.current,
      })

      quillRef.current = quill

      const initialHtml = latestHtmlRef.current ?? ''
      quill.root.innerHTML = initialHtml

      const handleTextChange = () => {
        if (disabledRef.current) return
        const html = sanitizeHtml(quill.root.innerHTML)
        latestHtmlRef.current = html
        onChangeRef.current(html)
      }

      const handleSelectionChange = (range: Range | null) => {
        if (!range) {
          onBlurRef.current?.()
        }
      }

      quill.on('text-change', handleTextChange)
      const selectionChangeHandler = (
        range: Range | null,
        _oldRange: Range | null,
        _source: unknown
      ) => handleSelectionChange(range)
      quill.on('selection-change', selectionChangeHandler)
      textChangeHandlerRef.current = handleTextChange
      selectionChangeHandlerRef.current = selectionChangeHandler

      const toolbar = quill.getModule('toolbar') as Toolbar | undefined
      toolbar?.addHandler('image', () => handleImageUpload(quill))
    }

    void initialize()

    return () => {
      isCancelled = true
      const quill = quillRef.current
      if (!quill) return

      const textHandler = textChangeHandlerRef.current
      if (textHandler) {
        quill.off('text-change', textHandler)
      }

      const selectionHandler = selectionChangeHandlerRef.current
      if (selectionHandler) {
        quill.off('selection-change', selectionHandler)
      }

      quillRef.current = null
      textChangeHandlerRef.current = null
      selectionChangeHandlerRef.current = null
    }
  }, [handleImageUpload, placeholder])

  useEffect(() => {
    const quill = quillRef.current
    if (!quill) return

    quill.enable(!disabledRef.current)
  }, [disabled])

  useEffect(() => {
    const quill = quillRef.current
    if (!quill) {
      latestHtmlRef.current = sanitizedValue
      return
    }

    if (!areHtmlContentsEqual(latestHtmlRef.current, sanitizedValue)) {
      const selection = quill.getSelection()
      quill.root.innerHTML = sanitizedValue
      latestHtmlRef.current = sanitizedValue
      if (selection) {
        quill.setSelection(selection.index, selection.length ?? 0)
      }
    }
  }, [sanitizedValue])

  return (
    <div className={cn('space-y-2', className)}>
      <div className='rounded-lg border border-input'>
        <div ref={wrapperRef} />
      </div>
      {sanitizedValue && plainText.length === 0 ? (
        <input
          className='hidden'
          value=''
          tabIndex={-1}
          aria-hidden='true'
          readOnly
        />
      ) : null}
    </div>
  )
}
