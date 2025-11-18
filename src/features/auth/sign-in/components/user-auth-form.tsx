import { useMemo, useState } from 'react'
import { z } from 'zod'
import { useForm, type UseFormReturn } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from '@tanstack/react-router'
import { AxiosError } from 'axios'
import { Loader2, LogIn } from 'lucide-react'
import { toast } from 'sonner'
import { useAuthStore, type AuthUser } from '@/stores/auth-store'
import { cn } from '@/lib/utils'
import { apiClient } from '@/lib/api-client'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/password-input'
import { useTranslation, type Translator } from '@/lib/i18n'

const ADMIN_LOGIN_URL = '/api/auth/admin/login'

type ApiErrorMap = Record<string, string | string[]>

interface AdminLoginData {
  access_token: string
  refresh_token: string
  token_type: string
  expires_in: number | null
  user: AuthUser
}

type AdminLoginApiResponse = {
  message?: string
  data?: AdminLoginData | boolean
  errors?: ApiErrorMap
  [key: string]: unknown
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function getLoginData(payload: AdminLoginApiResponse | null): AdminLoginData | null {
  if (!payload) return null
  if (!payload.data || typeof payload.data === 'boolean') return null
  if (!isRecord(payload.data)) return null

  const maybeData = payload.data

  const expiresInRaw =
    typeof maybeData === 'object' && maybeData !== null
      ? (maybeData as Record<string, unknown>).expires_in
      : undefined

  let expiresIn: number | null = null

  if (typeof expiresInRaw === 'number') {
    expiresIn = Number.isFinite(expiresInRaw) ? expiresInRaw : null
  } else if (typeof expiresInRaw === 'string') {
    const parsed = Number(expiresInRaw)
    expiresIn = Number.isFinite(parsed) ? parsed : null
  }

  if (
    typeof maybeData.access_token !== 'string' ||
    typeof maybeData.refresh_token !== 'string' ||
    typeof maybeData.token_type !== 'string' ||
    !isRecord(maybeData.user)
  ) {
    return null
  }

  return {
    access_token: maybeData.access_token,
    refresh_token: maybeData.refresh_token,
    token_type: maybeData.token_type,
    expires_in: expiresIn,
    user: maybeData.user as AuthUser,
  }
}

function getMessageFromResponse(payload: AdminLoginApiResponse | null) {
  if (!payload) return undefined
  if (typeof payload.message === 'string' && payload.message.trim().length > 0) {
    return payload.message
  }

  return undefined
}

function applyFieldErrors(
  form: UseFormReturn<UserAuthFormValues>,
  payload: AdminLoginApiResponse | null,
  fallbackMessage?: string
) {
  const errors = payload?.errors
  if (!errors || typeof errors !== 'object') return

  Object.entries(errors as ApiErrorMap).forEach(([field, value]) => {
    const message =
      typeof value === 'string'
        ? value
        : Array.isArray(value)
          ? value.filter((item): item is string => typeof item === 'string').join(', ')
          : fallbackMessage

    if (!message) return

    if (field in form.getValues()) {
      form.setError(field as 'email' | 'password', { message })
    } else {
      form.setError('root', { message })
    }
  })
}

const createFormSchema = (t: Translator) =>
  z.object({
    email: z.email({
      error: (iss) =>
        iss.input === ''
          ? t('auth.signIn.fields.email.required', 'Please enter your email')
          : undefined,
    }),
    password: z
      .string()
      .min(1, t('auth.signIn.fields.password.required', 'Please enter your password'))
      .min(
        7,
        t(
          'auth.signIn.fields.password.minLength',
          'Password must be at least 7 characters long'
        )
      ),
  })

type UserAuthFormSchema = ReturnType<typeof createFormSchema>
type UserAuthFormValues = z.infer<UserAuthFormSchema>

interface UserAuthFormProps extends React.HTMLAttributes<HTMLFormElement> {
  redirectTo?: string
}

export function UserAuthForm({
  className,
  redirectTo,
  ...props
}: UserAuthFormProps) {
  const { t } = useTranslation()
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()
  const { auth } = useAuthStore()
  const formSchema = useMemo(() => createFormSchema(t), [t])

  const form = useForm<UserAuthFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  async function onSubmit(data: UserAuthFormValues) {
    setIsLoading(true)
    form.clearErrors()
    const defaultErrorMessage = t(
      'auth.signIn.error.default',
      'Unable to sign in. Please try again.'
    )

    try {
      const { data: payload } = await apiClient.post<AdminLoginApiResponse>(
        ADMIN_LOGIN_URL,
        data
      )

      const loginData = getLoginData(payload)

      // console.log("loginData", loginData)
      // console.log(data)

      if (!loginData) {
        const message =
          getMessageFromResponse(payload) ?? defaultErrorMessage
        applyFieldErrors(form, payload, message)
        if (!form.formState.errors.root) {
          form.setError('root', { message })
        }
        throw new Error(message)
      }

      const expiresInSeconds =
        typeof loginData.expires_in === 'number' && loginData.expires_in > 0
          ? loginData.expires_in
          : null
      const expiresAt =
        expiresInSeconds !== null ? Date.now() + expiresInSeconds * 1000 : null

      auth.setSession({
        accessToken: loginData.access_token,
        refreshToken: loginData.refresh_token,
        tokenType: loginData.token_type,
        expiresAt,
      })

      auth.setUser(loginData.user)

      const successMessage =
        getMessageFromResponse(payload) ??
        t('auth.signIn.success', 'Login successfully')
      toast.success(successMessage)

      const targetPath = redirectTo || '/users'
      navigate({ to: targetPath, replace: true })
    } catch (error) {
      let message = defaultErrorMessage

      if (error instanceof AxiosError) {
        const payload = (error.response?.data ??
          null) as AdminLoginApiResponse | null
        applyFieldErrors(form, payload, message)
        message = getMessageFromResponse(payload) ?? message
      } else if (error instanceof Error && error.message) {
        message = error.message
      }

      if (!form.formState.errors.root && message) {
        form.setError('root', { message })
      }

      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className={cn('grid gap-3', className)}
        {...props}
      >
        <FormField
          control={form.control}
          name='email'
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {t('auth.signIn.fields.email.label', 'Email')}
              </FormLabel>
              <FormControl>
                <Input
                  placeholder={t(
                    'auth.signIn.fields.email.placeholder',
                    'name@example.com'
                  )}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name='password'
          render={({ field }) => (
            <FormItem className='relative'>
              <FormLabel>
                {t('auth.signIn.fields.password.label', 'Password')}
              </FormLabel>
              <FormControl>
                <PasswordInput
                  placeholder={t(
                    'auth.signIn.fields.password.placeholder',
                    '********'
                  )}
                  {...field}
                />
              </FormControl>
              <FormMessage />
              {/* <Link
                to='/forgot-password'
                className='text-muted-foreground absolute end-0 -top-0.5 text-sm font-medium hover:opacity-75'
              >
                Forgot password?
              </Link> */}
            </FormItem>
          )}
        />
        <Button className='mt-2' disabled={isLoading} type='submit'>
          {isLoading ? <Loader2 className='animate-spin' /> : <LogIn />}
          {t('auth.signIn.button', 'Sign in')}
        </Button>
        {form.formState.errors.root?.message ? (
          <p className='text-destructive text-sm font-medium'>
            {form.formState.errors.root.message}
          </p>
        ) : null}

        {/* <div className='relative my-2'>
          <div className='absolute inset-0 flex items-center'>
            <span className='w-full border-t' />
          </div>
          <div className='relative flex justify-center text-xs uppercase'>
            <span className='bg-background text-muted-foreground px-2'>
              Or continue with
            </span>
          </div>
        </div> */}

        {/* <div className='grid grid-cols-2 gap-2'>
          <Button variant='outline' type='button' disabled={isLoading}>
            <IconGithub className='h-4 w-4' /> GitHub
          </Button>
          <Button variant='outline' type='button' disabled={isLoading}>
            <IconFacebook className='h-4 w-4' /> Facebook
          </Button>
        </div> */}
      </form>
    </Form>
  )
}
