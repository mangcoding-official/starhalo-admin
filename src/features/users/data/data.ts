import { Shield, UserCheck, Users, CreditCard } from 'lucide-react'
import { type UserStatus } from './schema'

export const callTypes = new Map<UserStatus, string>([
  ['active', 'bg-teal-100/30 text-teal-900 dark:text-teal-200 border-teal-200'],
  ['inactive', 'bg-neutral-300/40 border-neutral-300'],
])

export const roles = [
  {
    label: 'Superadmin',
    labelKey: 'users.roles.superadmin',
    value: 'superadmin',
    icon: Shield,
  },
  {
    label: 'Admin',
    labelKey: 'users.roles.admin',
    value: 'admin',
    icon: UserCheck,
  },
  {
    label: 'Manager',
    labelKey: 'users.roles.manager',
    value: 'manager',
    icon: Users,
  },
  {
    label: 'Cashier',
    labelKey: 'users.roles.cashier',
    value: 'cashier',
    icon: CreditCard,
  },
] as const
