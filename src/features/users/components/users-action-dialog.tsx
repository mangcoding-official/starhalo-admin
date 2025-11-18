"use client"

import { useMemo } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { showSubmittedData } from '@/lib/show-submitted-data'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
import { SelectDropdown } from '@/components/select-dropdown'
import { useTranslation, type Translator } from '@/lib/i18n'
import { roles } from '../data/data'
import { type User } from '../data/schema'

function createUserFormSchema(t: Translator) {
  return z
    .object({
      firstName: z
        .string()
        .min(1, t('users.form.validation.firstName', 'First Name is required.')),
      lastName: z
        .string()
        .min(1, t('users.form.validation.lastName', 'Last Name is required.')),
      username: z
        .string()
        .min(1, t('users.form.validation.username', 'Username is required.')),
      phoneNumber: z
        .string()
        .min(
          1,
          t('users.form.validation.phoneNumber', 'Phone number is required.')
        ),
      email: z.email({
        error: (iss) =>
          iss.input === ''
            ? t('users.form.validation.email', 'Email is required.')
            : undefined,
      }),
      password: z.string().transform((pwd) => pwd.trim()),
      role: z
        .string()
        .min(1, t('users.invite.validation.role', 'Role is required.')),
      confirmPassword: z.string().transform((pwd) => pwd.trim()),
      isEdit: z.boolean(),
    })
    .refine(
      (data) => {
        if (data.isEdit && !data.password) return true
        return data.password.length > 0
      },
      {
        message: t(
          'users.form.validation.passwordRequired',
          'Password is required.'
        ),
        path: ['password'],
      }
    )
    .refine(
      ({ isEdit, password }) => {
        if (isEdit && !password) return true
        return password.length >= 8
      },
      {
        message: t(
          'users.form.validation.passwordLength',
          'Password must be at least 8 characters long.'
        ),
        path: ['password'],
      }
    )
    .refine(
      ({ isEdit, password }) => {
        if (isEdit && !password) return true
        return /[a-z]/.test(password)
      },
      {
        message: t(
          'users.form.validation.passwordLowercase',
          'Password must contain at least one lowercase letter.'
        ),
        path: ['password'],
      }
    )
    .refine(
      ({ isEdit, password }) => {
        if (isEdit && !password) return true
        return /\d/.test(password)
      },
      {
        message: t(
          'users.form.validation.passwordNumber',
          'Password must contain at least one number.'
        ),
        path: ['password'],
      }
    )
    .refine(
      ({ isEdit, password, confirmPassword }) => {
        if (isEdit && !password) return true
        return password === confirmPassword
      },
      {
        message: t(
          'users.form.validation.passwordMismatch',
          "Passwords don't match."
        ),
        path: ['confirmPassword'],
      }
    )
}

type UserFormSchema = ReturnType<typeof createUserFormSchema>
type UserForm = z.infer<UserFormSchema>

type UserActionDialogProps = {
  currentRow?: User
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function UsersActionDialog({
  currentRow,
  open,
  onOpenChange,
}: UserActionDialogProps) {
  const { t } = useTranslation()
  const formSchema = useMemo(() => createUserFormSchema(t), [t])
  const isEdit = !!currentRow
  const form = useForm<UserForm>({
    resolver: zodResolver(formSchema),
    defaultValues: isEdit
      ? {
          ...currentRow,
          password: '',
          confirmPassword: '',
          isEdit,
        }
      : {
          firstName: '',
          lastName: '',
          username: '',
          email: '',
          role: '',
          phoneNumber: '',
          password: '',
          confirmPassword: '',
          isEdit,
        },
  })

  const onSubmit = (values: UserForm) => {
    form.reset()
    showSubmittedData(values)
    onOpenChange(false)
  }

  const isPasswordTouched = !!form.formState.dirtyFields.password

  return (
    <Dialog
      open={open}
      onOpenChange={(state) => {
        form.reset()
        onOpenChange(state)
      }}
    >
      <DialogContent className='sm:max-w-lg'>
        <DialogHeader className='text-start'>
          <DialogTitle>
            {isEdit
              ? t('users.form.title.edit', 'Edit User')
              : t('users.form.title.add', 'Add New User')}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? t(
                  'users.form.description.edit',
                  "Update the user here. Click save when you're done."
                )
              : t(
                  'users.form.description.add',
                  "Create new user here. Click save when you're done."
                )}
          </DialogDescription>
        </DialogHeader>
        <div className='h-[26.25rem] w-[calc(100%+0.75rem)] overflow-y-auto py-1 pe-3'>
          <Form {...form}>
            <form
              id='user-form'
              onSubmit={form.handleSubmit(onSubmit)}
              className='space-y-4 px-0.5'
            >
              <FormField
                control={form.control}
                name='firstName'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 text-end'>
                      {t('users.form.fields.firstName.label', 'First Name')}
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t(
                          'users.form.fields.firstName.placeholder',
                          'John'
                        )}
                        className='col-span-4'
                        autoComplete='off'
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className='col-span-4 col-start-3' />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='lastName'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 text-end'>
                      {t('users.form.fields.lastName.label', 'Last Name')}
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t(
                          'users.form.fields.lastName.placeholder',
                          'Doe'
                        )}
                        className='col-span-4'
                        autoComplete='off'
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className='col-span-4 col-start-3' />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='username'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 text-end'>
                      {t('users.form.fields.username.label', 'Username')}
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t(
                          'users.form.fields.username.placeholder',
                          'john_doe'
                        )}
                        className='col-span-4'
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className='col-span-4 col-start-3' />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='email'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 text-end'>
                      {t('users.form.fields.email.label', 'Email')}
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t(
                          'users.form.fields.email.placeholder',
                          'john.doe@gmail.com'
                        )}
                        className='col-span-4'
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className='col-span-4 col-start-3' />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='phoneNumber'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 text-end'>
                      {t(
                        'users.form.fields.phoneNumber.label',
                        'Phone Number'
                      )}
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t(
                          'users.form.fields.phoneNumber.placeholder',
                          '+123456789'
                        )}
                        className='col-span-4'
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className='col-span-4 col-start-3' />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='role'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 text-end'>
                      {t('users.form.fields.role.label', 'Role')}
                    </FormLabel>
                    <SelectDropdown
                      defaultValue={field.value}
                      onValueChange={field.onChange}
                      placeholder={t(
                        'users.form.fields.role.placeholder',
                        'Select a role'
                      )}
                      className='col-span-4'
                      items={roles.map(({ label, labelKey, value }) => ({
                        label: t(labelKey, label),
                        value,
                      }))}
                    />
                    <FormMessage className='col-span-4 col-start-3' />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='password'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 text-end'>
                      {t('users.form.fields.password.label', 'Password')}
                    </FormLabel>
                    <FormControl>
                      <PasswordInput
                        placeholder={t(
                          'users.form.fields.password.placeholder',
                          'e.g., S3cur3P@ssw0rd'
                        )}
                        className='col-span-4'
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className='col-span-4 col-start-3' />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='confirmPassword'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 text-end'>
                      {t(
                        'users.form.fields.confirmPassword.label',
                        'Confirm Password'
                      )}
                    </FormLabel>
                    <FormControl>
                      <PasswordInput
                        disabled={!isPasswordTouched}
                        placeholder={t(
                          'users.form.fields.confirmPassword.placeholder',
                          'e.g., S3cur3P@ssw0rd'
                        )}
                        className='col-span-4'
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className='col-span-4 col-start-3' />
                  </FormItem>
                )}
              />
            </form>
          </Form>
        </div>
        <DialogFooter>
          <Button type='submit' form='user-form'>
            {t('users.form.submit', 'Save changes')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
