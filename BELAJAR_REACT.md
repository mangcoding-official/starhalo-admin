# 📚 Panduan Belajar React - Studi Kasus Project Starhalo Admin

Dokumentasi ini dibuat untuk membantu Anda memahami React dengan mempelajari project Starhalo Admin. Dokumentasi ini dibagi menjadi 3 bagian utama:

1. **Perkenalan React & Teknologi Project**
2. **Konsep-Konsep React Penting**
3. **Cara Rebuild Project dari Awal**

---

## 📖 BAGIAN 1: Perkenalan React & Teknologi yang Digunakan

### Apa itu React?

React adalah **library JavaScript** untuk membangun User Interface (UI). React membuat UI lebih mudah dibuat dan dirawat dengan cara:

- **Component-Based**: UI dibagi menjadi komponen-komponen kecil yang bisa digunakan berulang
- **Declarative**: Anda menjelaskan "apa yang ingin Anda tampilkan", bukan "bagaimana cara menampilkannya"
- **Reactive**: UI otomatis update ketika data berubah

### Teknologi Stack yang Digunakan di Project Ini

Project Starhalo Admin menggunakan teknologi modern berikut:

#### 🎯 Core Framework & Library

1. **React 19.1.2**
   - Library utama untuk UI
   - Menggunakan React Hooks untuk state management

2. **TypeScript**
   - JavaScript dengan type safety
   - Mencegah error lebih awal dengan type checking

3. **Vite 7.1.2**
   - Build tool yang sangat cepat
   - Development server instant hot reload
   - Optimized production builds

#### 🛣️ Routing & Navigation

4. **TanStack Router 1.131.16**
   - File-based routing (mirip Next.js)
   - Type-safe routing dengan TypeScript
   - Automatic code splitting

#### 📊 Data Fetching & State Management

5. **TanStack Query (React Query) 5.85.3**
   - Mengelola server state (data dari API)
   - Caching, refetching, background updates otomatis
   - Loading dan error states built-in

6. **Zustand 5.0.7**
   - Global state management yang sederhana
   - Digunakan untuk auth state, theme, dll

#### 🎨 UI & Styling

7. **Tailwind CSS 4.1.12**
   - Utility-first CSS framework
   - Styling langsung di JSX dengan className

8. **Radix UI**
   - Collection of unstyled, accessible UI components
   - Digunakan untuk: Dialog, Dropdown, Select, dll

9. **Shadcn/ui**
   - Koleksi komponen UI yang dibuat dengan Radix UI dan Tailwind
   - Fully customizable dan copy-paste friendly

#### 📝 Forms & Validation

10. **React Hook Form 7.62.0**
    - Performant form library dengan minimal re-renders
    - Mudah diintegrasikan dengan validasi

11. **Zod 4.0.17**
    - Schema validation library
    - TypeScript-first schema validation

#### 🔧 Utilities

12. **Axios 1.11.0**
    - HTTP client untuk API calls
    - Interceptors untuk auth token handling

13. **Date-fns 4.1.0**
    - Utility untuk manipulasi tanggal

14. **Sonner 2.0.7**
    - Toast notification library

### Struktur Folder Project

```
starhalo-admin/
├── public/                 # Static files (images, favicon, .htaccess)
│   └── images/
├── src/
│   ├── assets/            # SVG icons, logos, custom assets
│   ├── components/        # Reusable UI components
│   │   ├── ui/           # Shadcn UI components (button, dialog, dll)
│   │   ├── layout/       # Layout components (header, sidebar, dll)
│   │   └── data-table/   # Table-related components
│   ├── context/          # React Context providers (theme, i18n, dll)
│   ├── features/         # Feature-based modules
│   │   ├── auth/        # Authentication feature
│   │   ├── users/       # User management feature
│   │   ├── dashboard/   # Dashboard feature
│   │   └── ...
│   ├── hooks/           # Custom React hooks
│   ├── lib/             # Utility functions & helpers
│   ├── locales/         # Translation files (i18n)
│   ├── routes/          # TanStack Router route files
│   ├── stores/          # Zustand stores
│   ├── styles/          # Global CSS files
│   └── main.tsx         # Entry point aplikasi
├── index.html           # HTML template
├── vite.config.ts       # Vite configuration
├── tsconfig.json        # TypeScript configuration
└── package.json         # Dependencies & scripts
```

### Cara Kerja Aplikasi

1. **Entry Point** (`src/main.tsx`)
   - ReactDOM membuat root dan render aplikasi
   - Setup providers (QueryClient, Router, Theme, dll)

2. **Routing** (`src/routes/`)
   - File-based routing
   - Setiap file route auto-generate route di aplikasi

3. **Components**
   - Components di `features/` adalah page-level components
   - Components di `components/` adalah reusable UI components

4. **Data Flow**
   - TanStack Query untuk server data
   - Zustand untuk global state (auth, theme)
   - React Context untuk theme, i18n, dll

---

## 🧠 BAGIAN 2: Konsep-Konsep React yang Harus Diketahui

### 1. Komponen (Components)

Komponen adalah building block dari React. Ada 2 jenis:

#### Function Component (Modern - yang digunakan di project ini)

```tsx
// Contoh dari: src/features/dashboard/index.tsx
export function Dashboard() {
  const { t } = useTranslation()
  
  return (
    <>
      <Header>
        <Search />
      </Header>
      <Main>
        <h1>{t('dashboard.page.title')}</h1>
      </Main>
    </>
  )
}
```

**Penjelasan:**
- Function yang return JSX (JavaScript XML)
- Nama harus CapitalCase
- Bisa menerima `props` sebagai parameter
- Bisa menggunakan hooks

### 2. JSX (JavaScript XML)

JSX adalah syntax extension untuk menulis HTML-like code di JavaScript:

```tsx
// Contoh dari project
<div className='mb-4'>
  <h1 className='text-2xl font-bold'>{t('dashboard.page.title')}</h1>
  <p className='text-muted-foreground'>Description</p>
</div>
```

**Aturan JSX:**
- `className` bukan `class` (karena `class` adalah reserved word di JS)
- Self-closing tags harus ditutup: `<img />` bukan `<img>`
- Curly braces `{}` untuk JavaScript expressions
- Hanya bisa return satu root element (atau gunakan Fragment `<>...</>`)

### 3. Props (Properties)

Props adalah cara untuk mengirim data ke component:

```tsx
// Component menerima props
function Button({ className, variant, size, ...props }) {
  return (
    <button className={cn(buttonVariants({ variant, size, className }))}>
      {props.children}
    </button>
  )
}

// Menggunakan component dengan props
<Button variant="default" size="lg" className="my-4">
  Click Me
</Button>
```

**Contoh dari project:**
```tsx
// src/components/ui/button.tsx
function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : 'button'
  return <Comp className={cn(buttonVariants({ variant, size, className }))} {...props} />
}
```

### 4. State Management dengan Hooks

#### useState - Local Component State

```tsx
import { useState } from 'react'

function Counter() {
  const [count, setCount] = useState(0) // [state, setter]
  
  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>Increment</button>
    </div>
  )
}
```

**Contoh dari project:**
```tsx
// src/hooks/use-table-url-state.ts
const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>(initialColumnFilters)

const [pagination, setPagination] = useState<PaginationState>(() =>
  derivePagination(search)
)
```

**Tips:**
- `useState` trigger re-render ketika state berubah
- Function initializer `useState(() => value)` untuk expensive calculations
- State update adalah async

#### useEffect - Side Effects

Digunakan untuk side effects seperti API calls, subscriptions, DOM manipulation:

```tsx
import { useEffect, useState } from 'react'

function UserProfile({ userId }) {
  const [user, setUser] = useState(null)
  
  useEffect(() => {
    // Effect berjalan setelah render
    fetchUser(userId).then(setUser)
    
    // Cleanup function (optional)
    return () => {
      // Cleanup jika component unmount
    }
  }, [userId]) // Dependency array - effect berjalan jika userId berubah
  
  return <div>{user?.name}</div>
}
```

**Contoh dari project:**
```tsx
// src/features/users/index.tsx
useEffect(() => {
  if (error instanceof Error) {
    toast.error(error.message)
  }
}, [error])
```

**Dependency Array:**
- `[]` - Run sekali saat mount
- `[dep1, dep2]` - Run jika dep1 atau dep2 berubah
- No array - Run setiap render (hati-hati!)

#### useCallback - Memoized Functions

Mencegah function dibuat ulang setiap render:

```tsx
import { useCallback, useState } from 'react'

function UsersTable() {
  const [sort, setSort] = useState('desc')
  
  // Function ini hanya dibuat ulang jika sort berubah
  const handleSortChange = useCallback(
    (newSort) => {
      setSort(newSort)
      // ... logic lainnya
    },
    [sort] // Dependencies
  )
  
  return <Table onSortChange={handleSortChange} />
}
```

**Contoh dari project:**
```tsx
// src/features/users/index.tsx
const handleSortingChange = useCallback(
  (updater: SortingState | ((state: SortingState) => SortingState)) => {
    const next = typeof updater === 'function' ? updater(sorting) : updater
    const nextSort = next[0]?.desc === false ? 'asc' : 'desc'
    
    navigate({
      search: (prev) => ({
        ...(prev as Record<string, unknown>),
        sort: nextSort === 'desc' ? undefined : nextSort,
      }),
    })
  },
  [navigate, sorting] // Dependencies
)
```

**Kapan digunakan:**
- Function yang di-pass sebagai prop ke child component
- Function di dependency array useEffect/useMemo

#### useMemo - Memoized Values

Menghitung ulang value hanya jika dependencies berubah:

```tsx
import { useMemo, useState } from 'react'

function UsersTable({ users, searchTerm }) {
  // Filtered users hanya dihitung ulang jika users atau searchTerm berubah
  const filteredUsers = useMemo(() => {
    return users.filter(user => 
      user.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [users, searchTerm])
  
  return <Table data={filteredUsers} />
}
```

**Contoh dari project:**
```tsx
// src/features/users/index.tsx
const sorting = useMemo<SortingState>(
  () => [
    {
      id: 'createdAt',
      desc: sort !== 'asc',
    },
  ],
  [sort] // Hanya recalculate jika sort berubah
)
```

### 5. Context API - Global State tanpa Props Drilling

Context memungkinkan data di-share tanpa pass props melalui setiap level:

```tsx
// 1. Create Context
const ThemeContext = createContext()

// 2. Create Provider
function ThemeProvider({ children }) {
  const [theme, setTheme] = useState('light')
  
  const value = useMemo(() => ({
    theme,
    setTheme,
    toggleTheme: () => setTheme(prev => prev === 'light' ? 'dark' : 'light')
  }), [theme])
  
  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
}

// 3. Use Context
function ThemedButton() {
  const { theme, toggleTheme } = useContext(ThemeContext)
  
  return (
    <button onClick={toggleTheme}>
      Current theme: {theme}
    </button>
  )
}
```

**Contoh dari project:**
```tsx
// src/lib/i18n.tsx
export function TranslationProvider({ children, initialLocale }) {
  const [locale, setLocaleState] = useState<Locale>(() =>
    normalizeLocale(initialLocale)
  )
  
  const value = useMemo<TranslationContextValue>(() => {
    const translator = createTranslator(locale)
    return {
      locale,
      setLocale,
      t: translator,
    }
  }, [locale, setLocale])
  
  return (
    <TranslationContext.Provider value={value}>
      {children}
    </TranslationContext.Provider>
  )
}

// Menggunakan:
export function useTranslation() {
  return useContext(TranslationContext)
}

// Di component:
function Dashboard() {
  const { t } = useTranslation()
  return <h1>{t('dashboard.page.title')}</h1>
}
```

### 6. Custom Hooks - Reusable Logic

Custom hooks adalah function yang menggunakan hooks untuk logic yang bisa digunakan ulang:

```tsx
// Custom hook
function useUsers(page, pageSize) {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    setLoading(true)
    fetchUsers(page, pageSize)
      .then(setUsers)
      .finally(() => setLoading(false))
  }, [page, pageSize])
  
  return { users, loading }
}

// Menggunakan custom hook
function UsersPage() {
  const { users, loading } = useUsers(1, 10)
  
  if (loading) return <div>Loading...</div>
  return <UsersTable data={users} />
}
```

**Contoh dari project:**
```tsx
// src/hooks/use-mobile.tsx
export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false)
  
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    
    return () => window.removeEventListener('resize', checkMobile)
  }, [])
  
  return isMobile
}
```

### 7. TanStack Query (React Query) - Server State Management

TanStack Query mengelola server state dengan caching, refetching, dll:

```tsx
import { useQuery } from '@tanstack/react-query'

function Users() {
  // Query untuk fetch data
  const { data, isLoading, error } = useQuery({
    queryKey: ['users', page, pageSize], // Unique key untuk cache
    queryFn: () => fetchUsers(page, pageSize), // Function untuk fetch
    staleTime: 5 * 60 * 1000, // Data dianggap fresh selama 5 menit
  })
  
  if (isLoading) return <div>Loading...</div>
  if (error) return <div>Error: {error.message}</div>
  
  return <UsersTable data={data.users} />
}
```

**Contoh dari project:**
```tsx
// src/features/auth/hooks/use-current-user.ts
export function useCurrentUser(): UseQueryResult<AuthUser, Error> {
  const accessToken = useAuthStore((s) => s.auth.accessToken)
  const setUser = useAuthStore((s) => s.auth.setUser)
  
  const result = useQuery<AuthUser, Error, AuthUser, typeof queryKey>({
    queryKey: ['auth', 'me'],
    queryFn: getCurrentUser,
    enabled: !!accessToken, // Hanya fetch jika ada accessToken
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    refetchOnWindowFocus: false,
  })
  
  useEffect(() => {
    if (result.status === 'success' && result.data) {
      setUser(result.data)
    }
  }, [result.status, result.data, setUser])
  
  return result
}
```

**Key Concepts:**
- `queryKey`: Unique identifier untuk cache
- `queryFn`: Function yang return Promise
- `enabled`: Control kapan query dijalankan
- `staleTime`: Berapa lama data dianggap fresh
- `gcTime`: Berapa lama data di cache sebelum dihapus

### 8. Zustand - Simple Global State

Zustand adalah state management yang lebih sederhana dari Redux:

```tsx
import { create } from 'zustand'

// Define store
const useStore = create((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
  decrement: () => set((state) => ({ count: state.count - 1 })),
}))

// Use store di component
function Counter() {
  const { count, increment, decrement } = useStore()
  
  return (
    <div>
      <p>{count}</p>
      <button onClick={increment}>+</button>
      <button onClick={decrement}>-</button>
    </div>
  )
}
```

**Contoh dari project:**
```tsx
// src/stores/auth-store.ts
export const useAuthStore = create<AuthState>()((set) => ({
  auth: {
    user: null,
    setUser: (user) =>
      set((state) => ({ ...state, auth: { ...state.auth, user } })),
    accessToken: '',
    setAccessToken: (accessToken) =>
      set((state) => {
        const nextSession = { ...state.auth, accessToken }
        persistSession(nextSession)
        return { ...state, auth: nextSession }
      }),
    reset: () =>
      set((state) => ({
        ...state,
        auth: {
          ...state.auth,
          user: null,
          accessToken: '',
        },
      })),
  },
}))

// Menggunakan:
function Profile() {
  const user = useAuthStore((state) => state.auth.user)
  const setUser = useAuthStore((state) => state.auth.setUser)
  
  return <div>{user?.name}</div>
}
```

### 9. TanStack Router - File-Based Routing

TanStack Router menggunakan file-based routing:

```tsx
// src/routes/_authenticated/users/index.tsx
import { createFileRoute } from '@tanstack/react-router'
import { Users } from '@/features/users'

const usersSearchSchema = z.object({
  page: z.number().optional().catch(1),
  pageSize: z.number().optional().catch(10),
})

export const Route = createFileRoute('/_authenticated/users/')({
  validateSearch: usersSearchSchema,
  component: Users,
})
```

**Route Structure:**
- File di `routes/` menjadi route
- `_authenticated` adalah layout route
- `(auth)` adalah grouped route (tidak affect URL)
- `$param` adalah dynamic route

**Menggunakan route di component:**
```tsx
import { getRouteApi } from '@tanstack/react-router'

const route = getRouteApi('/_authenticated/users/')

export function Users() {
  const search = route.useSearch() // Get URL search params
  const navigate = route.useNavigate() // Navigation function
  
  const page = search.page ?? 1
  
  const handlePageChange = (newPage) => {
    navigate({
      search: { page: newPage },
    })
  }
}
```

### 10. React Hook Form - Form Management

React Hook Form adalah library untuk mengelola form dengan performa baik:

```tsx
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const formSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email'),
})

function UserForm() {
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
    },
  })
  
  const onSubmit = (data) => {
    console.log(data)
  }
  
  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <input {...form.register('name')} />
      {form.formState.errors.name && (
        <p>{form.formState.errors.name.message}</p>
      )}
      
      <input {...form.register('email')} />
      {form.formState.errors.email && (
        <p>{form.formState.errors.email.message}</p>
      )}
      
      <button type="submit">Submit</button>
    </form>
  )
}
```

---

## 🏗️ BAGIAN 3: Cara Rebuild Project dari Awal

### Langkah 1: Setup Project

#### 1.1 Install Node.js & Package Manager

```bash
# Install Node.js (v18 atau lebih baru)
# Download dari: https://nodejs.org

# Install package manager (pilih salah satu)
npm install -g yarn
# atau
npm install -g pnpm
# atau
npm install -g bun
```

#### 1.2 Inisialisasi Project

```bash
# Buat folder project
mkdir starhalo-admin
cd starhalo-admin

# Inisialisasi dengan Vite + React + TypeScript
npm create vite@latest . -- --template react-ts
# atau dengan yarn
yarn create vite . --template react-ts
```

#### 1.3 Install Dependencies

```bash
# Install semua dependencies dari package.json
yarn install
# atau
npm install
# atau
pnpm install
```

**Dependencies utama yang perlu diinstall:**

```json
{
  "dependencies": {
    "react": "^19.1.2",
    "react-dom": "^19.1.2",
    "@tanstack/react-query": "^5.85.3",
    "@tanstack/react-router": "^1.131.16",
    "@tanstack/react-table": "^8.21.3",
    "zustand": "^5.0.7",
    "axios": "^1.11.0",
    "react-hook-form": "^7.62.0",
    "zod": "^4.0.17",
    "tailwindcss": "^4.1.12",
    "@radix-ui/react-dialog": "^1.1.15",
    // ... dan lainnya
  }
}
```

### Langkah 2: Konfigurasi Vite

#### 2.1 Setup `vite.config.ts`

```typescript
// vite.config.ts
import path from 'path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import tailwindcss from '@tailwindcss/vite'
import { tanstackRouter } from '@tanstack/router-plugin/vite'

export default defineConfig({
  plugins: [
    tanstackRouter({
      target: 'react',
      autoCodeSplitting: true,
    }),
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

**Penjelasan:**
- `@vitejs/plugin-react-swc`: React plugin dengan SWC (super fast)
- `@tailwindcss/vite`: Tailwind CSS plugin
- `@tanstack/router-plugin`: Auto-generate route tree
- `resolve.alias`: Path alias untuk import (`@/components`)

#### 2.2 Setup TypeScript Path Alias

```json
// tsconfig.json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

### Langkah 3: Setup Tailwind CSS

#### 3.1 Konfigurasi Tailwind

```typescript
// tailwind.config.ts (jika menggunakan Tailwind v3)
// atau langsung di CSS untuk Tailwind v4

// src/styles/index.css
@import "tailwindcss";
```

#### 3.2 Import CSS di main.tsx

```typescript
// src/main.tsx
import './styles/index.css'
```

### Langkah 4: Setup TanStack Router

#### 4.1 Buat Root Route

```typescript
// src/routes/__root.tsx
import { createRootRoute, Outlet } from '@tanstack/react-router'

export const Route = createRootRoute({
  component: () => (
    <>
      <Outlet />
    </>
  ),
})
```

#### 4.2 Buat Route Files

```typescript
// src/routes/index.tsx
import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  beforeLoad: () => {
    throw redirect({ to: '/dashboard' })
  },
})

// src/routes/dashboard.tsx
import { createFileRoute } from '@tanstack/react-router'
import { Dashboard } from '@/features/dashboard'

export const Route = createFileRoute('/dashboard')({
  component: Dashboard,
})
```

#### 4.3 Setup Router di main.tsx

```typescript
// src/main.tsx
import { RouterProvider, createRouter } from '@tanstack/react-router'
import { routeTree } from './routeTree.gen'

const router = createRouter({
  routeTree,
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <RouterProvider router={router} />
)
```

### Langkah 5: Setup TanStack Query

#### 5.1 Buat QueryClient

```typescript
// src/main.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 10 * 1000, // 10 seconds
      refetchOnWindowFocus: false,
    },
  },
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <QueryClientProvider client={queryClient}>
    <RouterProvider router={router} />
  </QueryClientProvider>
)
```

### Langkah 6: Setup Zustand Store

#### 6.1 Buat Auth Store

```typescript
// src/stores/auth-store.ts
import { create } from 'zustand'

interface AuthState {
  user: User | null
  accessToken: string
  setUser: (user: User | null) => void
  setAccessToken: (token: string) => void
  reset: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: '',
  setUser: (user) => set({ user }),
  setAccessToken: (accessToken) => set({ accessToken }),
  reset: () => set({ user: null, accessToken: '' }),
}))
```

### Langkah 7: Setup API Client dengan Axios

#### 7.1 Buat API Client

```typescript
// src/lib/api-client.ts
import axios from 'axios'
import { useAuthStore } from '@/stores/auth-store'

const baseURL = import.meta.env.VITE_API_BASE_URL || 'https://api.example.com'

export const apiClient = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor - tambahkan token
apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Response interceptor - handle errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized
      useAuthStore.getState().reset()
    }
    return Promise.reject(error)
  }
)
```

### Langkah 8: Setup Context Providers

#### 8.1 Buat Theme Provider

```typescript
// src/context/theme-provider.tsx
import { createContext, useContext, useState, useEffect } from 'react'

type Theme = 'light' | 'dark' | 'system'

const ThemeContext = createContext<{
  theme: Theme
  setTheme: (theme: Theme) => void
}>({
  theme: 'system',
  setTheme: () => {},
})

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState<Theme>(() => {
    const stored = localStorage.getItem('theme')
    return (stored as Theme) || 'system'
  })
  
  useEffect(() => {
    const root = window.document.documentElement
    root.classList.remove('light', 'dark')
    
    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)')
        .matches
        ? 'dark'
        : 'light'
      root.classList.add(systemTheme)
    } else {
      root.classList.add(theme)
    }
    
    localStorage.setItem('theme', theme)
  }, [theme])
  
  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)
```

#### 8.2 Wrap App dengan Providers

```typescript
// src/main.tsx
ReactDOM.createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <RouterProvider router={router} />
      </ThemeProvider>
    </QueryClientProvider>
  </StrictMode>
)
```

### Langkah 9: Buat Custom Hooks

#### 9.1 Hook untuk Fetch Data

```typescript
// src/hooks/use-users-query.ts
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'

export function useUsersQuery({ page, pageSize, sort, search }) {
  return useQuery({
    queryKey: ['users', page, pageSize, sort, search],
    queryFn: async () => {
      const { data } = await apiClient.get('/users', {
        params: { page, per_page: pageSize, sort, search },
      })
      return data
    },
  })
}
```

### Langkah 10: Build & Deploy

#### 10.1 Build untuk Production

```bash
# Build project
yarn build
# atau
npm run build

# Output akan di folder dist/
```

#### 10.2 Setup untuk Deploy

**Untuk Apache:**
- Buat file `.htaccess` di `public/` (sudah ada di project)
- Vite akan otomatis copy ke `dist/`

**Untuk Netlify:**
- Buat `netlify.toml`:
```toml
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

**Untuk Vercel:**
- Buat `vercel.json`:
```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

### Langkah 11: Best Practices & Tips

#### 11.1 Struktur Component

```
features/
  users/
    components/        # User-specific components
      users-table.tsx
      users-form.tsx
    hooks/            # User-specific hooks
      use-users-query.ts
    api/              # User-specific API calls
      get-users.ts
    index.tsx         # Main feature component
    data/
      schema.ts       # TypeScript types/schemas
```

#### 11.2 Naming Conventions

- Components: `PascalCase` - `UsersTable.tsx`
- Hooks: `camelCase` dengan prefix `use` - `useUsersQuery.ts`
- Utilities: `camelCase` - `formatDate.ts`
- Types: `PascalCase` atau `UPPER_CASE` untuk constants

#### 11.3 Import Organization

```typescript
// 1. External libraries
import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'

// 2. Internal modules (absolute path dengan @)
import { Button } from '@/components/ui/button'
import { useUsersQuery } from '@/hooks/use-users-query'

// 3. Relative imports
import { UserForm } from './components/user-form'
```

#### 11.4 Error Handling

```typescript
// Di component
const { data, error, isLoading } = useUsersQuery()

useEffect(() => {
  if (error) {
    toast.error(error.message)
  }
}, [error])

// Di API client
try {
  const response = await apiClient.get('/users')
  return response.data
} catch (error) {
  if (error.response?.status === 404) {
    throw new Error('Users not found')
  }
  throw error
}
```

### Troubleshooting Common Issues

#### Issue 1: Module not found
**Solusi:** Pastikan path alias `@/*` sudah di-setup di `tsconfig.json` dan `vite.config.ts`

#### Issue 2: Router not found
**Solusi:** Pastikan `routeTree.gen.ts` sudah di-generate:
```bash
yarn build
# atau
npx @tanstack/router-cli generate
```

#### Issue 3: Tailwind not working
**Solusi:** Pastikan CSS di-import di `main.tsx`:
```typescript
import './styles/index.css'
```

#### Issue 4: Build error
**Solusi:** Clear cache dan rebuild:
```bash
rm -rf node_modules dist
yarn install
yarn build
```

---

## 📝 Kesimpulan

Project Starhalo Admin menggunakan stack modern React dengan:

- **React 19** untuk UI
- **TypeScript** untuk type safety
- **Vite** untuk build tool
- **TanStack Router** untuk routing
- **TanStack Query** untuk server state
- **Zustand** untuk global state
- **Tailwind CSS** untuk styling
- **React Hook Form + Zod** untuk forms

Konsep-konsep penting yang harus dipahami:
1. Components & JSX
2. Props & State
3. Hooks (useState, useEffect, useCallback, useMemo)
4. Context API
5. Custom Hooks
6. TanStack Query untuk data fetching
7. Zustand untuk state management
8. TanStack Router untuk routing

Dengan memahami konsep-konsep di atas dan mengikuti langkah-langkah rebuild, Anda akan bisa membuat aplikasi React yang modern dan maintainable.

**Selamat Belajar! 🚀**

