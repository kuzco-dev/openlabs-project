import { createClient } from '@/utils/supabase/server'
import { login } from '@/utils/actions'

// Mock Supabase client
jest.mock('@/utils/supabase/server', () => ({
  createClient: jest.fn(),
}))

// Mock Next.js navigation redirect
const redirectMock = jest.fn()
jest.mock('next/navigation', () => ({
  redirect: (...args: any[]) => redirectMock(...args),
}))

// Minimal FormData polyfill for Node test environment
class SimpleFormData {
  private map = new Map<string, any>()
  append(key: string, value: any) {
    this.map.set(key, value)
  }
  entries() {
    return this.map.entries()
  }
}
;(global as any).FormData = SimpleFormData as any

describe('Server Action: login', () => {
  let mockSupabase: any

  beforeEach(() => {
    jest.clearAllMocks()

    mockSupabase = {
      auth: {
        signInWithPassword: jest.fn(),
      },
      from: jest.fn(),
    }

    ;(createClient as jest.Mock).mockResolvedValue(mockSupabase)
  })

  it('returns error when payload is not FormData', async () => {
    const res = await login(undefined as any, {} as any)
    expect(res).toEqual({ success: false, message: 'Invalid data format' })
    expect(redirectMock).not.toHaveBeenCalled()
  })

  it('returns error when schema validation fails', async () => {
    const fd = new FormData()
    ;(fd as any).append('email', 'invalid-email')
    ;(fd as any).append('password', '123')

    const res = await login(undefined as any, fd as any)
    expect(res?.success).toBe(false)
    expect(typeof res?.message).toBe('string')
    expect(redirectMock).not.toHaveBeenCalled()
  })

  it('returns error when signInWithPassword fails', async () => {
    const fd = new FormData()
    ;(fd as any).append('email', 'user@example.com')
    ;(fd as any).append('password', 'supersecret')

    mockSupabase.auth.signInWithPassword.mockResolvedValue({ error: 'sign-in-error' })

    const res = await login(undefined as any, fd as any)
    expect(res).toEqual({ success: false, message: 'Internal error, try later' })
    expect(redirectMock).not.toHaveBeenCalled()
  })

  it('returns error when role lookup fails', async () => {
    const fd = new FormData()
    ;(fd as any).append('email', 'user@example.com')
    ;(fd as any).append('password', 'supersecret')

    mockSupabase.auth.signInWithPassword.mockResolvedValue({ data: { user: { id: 'user-1' } } })
    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'roles') {
        return {
          select: () => ({
            eq: () => ({
              single: () => Promise.resolve({ error: 'roles-error' }),
            }),
          }),
        } as any
      }
      return {} as any
    })

    const res = await login(undefined as any, fd as any)
    expect(res).toEqual({ success: false, message: 'Could not fetch user role' })
    expect(redirectMock).not.toHaveBeenCalled()
  })

  it('redirects to /admin when role is admin', async () => {
    const fd = new FormData()
    ;(fd as any).append('email', 'admin@example.com')
    ;(fd as any).append('password', 'supersecret')

    mockSupabase.auth.signInWithPassword.mockResolvedValue({ data: { user: { id: 'user-2' } } })
    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'roles') {
        return {
          select: () => ({
            eq: () => ({
              single: () => Promise.resolve({ data: { role: 'admin' } }),
            }),
          }),
        } as any
      }
      return {} as any
    })

    await login(undefined as any, fd as any)
    expect(redirectMock).toHaveBeenCalledWith('/admin')
  })

  it('redirects to /user when role is user', async () => {
    const fd = new FormData()
    ;(fd as any).append('email', 'student@example.com')
    ;(fd as any).append('password', 'supersecret')

    mockSupabase.auth.signInWithPassword.mockResolvedValue({ data: { user: { id: 'user-3' } } })
    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'roles') {
        return {
          select: () => ({
            eq: () => ({
              single: () => Promise.resolve({ data: { role: 'user' } }),
            }),
          }),
        } as any
      }
      return {} as any
    })

    await login(undefined as any, fd as any)
    expect(redirectMock).toHaveBeenCalledWith('/user')
  })
})

