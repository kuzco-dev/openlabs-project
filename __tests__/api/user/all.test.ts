import { createClient } from '@/utils/supabase/server';
import { GET } from '@/app/api/user/all/route';
import { NextResponse } from 'next/server';

// Mock Supabase client
jest.mock('@/utils/supabase/server', () => ({
  createClient: jest.fn(),
}));

describe('GET /api/user/all', () => {
  let mockSupabase: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup mock Supabase client
    mockSupabase = {
      auth: {
        getUser: jest.fn(),
      },
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn().mockReturnThis(),
    };

    (createClient as jest.Mock).mockResolvedValue(mockSupabase);
  });

  it('should return 401 if user is not authenticated', async () => {
    // Mock unauthenticated user
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } });

    const response = await GET() as unknown as API.Response;
    expect(response.data).toEqual({ error: 'Not authorized' });
    expect(response.init?.status).toBe(401);
  });

  it('should return 401 if user is not a regular user', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: '6d65c85b-4996-49c0-adb1-2f603437dec0' } } });
    mockSupabase.from.mockImplementation(() => ({
      select: () => ({
        eq: () => ({
          maybeSingle: () => Promise.resolve({ data: { role: 'admin' } }),
        }),
      }),
    }));

    const response = await GET() as unknown as API.Response;
    expect(response.data).toEqual({ error: 'Not authorized' });
    expect(response.init?.status).toBe(401);
  });

  it('should return 401 if roles lookup fails', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'user-1' } } });
    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'roles') {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: () => Promise.resolve({ error: 'Roles query failed' }),
            }),
          }),
        } as any;
      }
      return {} as any;
    });

    const response = (await GET()) as unknown as API.Response;
    expect(response.data).toEqual({ error: 'Not authorized' });
    expect(response.init?.status).toBe(401);
  });

  it('should return 500 if fetching profile fails', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'user-2' } } });
    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'roles') {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: () => Promise.resolve({ data: { role: 'user' } }),
            }),
          }),
        } as any;
      }
      if (table === 'profiles') {
        return {
          select: () => ({
            eq: () => ({
              single: () => Promise.resolve({ error: 'Profile error' }),
            }),
          }),
        } as any;
      }
      return {} as any;
    });

    const response = (await GET()) as unknown as API.Response;
    expect(response.data).toEqual({ error: 'Internal error' });
    expect(response.init?.status).toBe(500);
  });

  it('should return 500 if profile has no email', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'user-3' } } });
    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'roles') {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: () => Promise.resolve({ data: { role: 'user' } }),
            }),
          }),
        } as any;
      }
      if (table === 'profiles') {
        return {
          select: () => ({
            eq: () => ({
              single: () => Promise.resolve({ data: { email: undefined } }),
            }),
          }),
        } as any;
      }
      return {} as any;
    });

    const response = (await GET()) as unknown as API.Response;
    expect(response.data).toEqual({ error: 'Internal error' });
    expect(response.init?.status).toBe(500);
  });

  it('should return empty array when user is not in any institution', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'user-4' } } });
    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'roles') {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: () => Promise.resolve({ data: { role: 'user' } }),
            }),
          }),
        } as any;
      }
      if (table === 'profiles') {
        return {
          select: () => ({
            eq: () => ({
              single: () => Promise.resolve({ data: { email: 'user@example.com' } }),
            }),
          }),
        } as any;
      }
      if (table === 'institution_list') {
        return {
          select: () => ({
            eq: () => Promise.resolve({ data: [] }),
          }),
        } as any;
      }
      return {} as any;
    });

    const response = (await GET()) as unknown as API.Response;
    expect(response.data).toEqual([]);
    expect(response.init?.status).toBe(200);
  });

  it('should return 500 if querying institution list fails', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'user-5' } } });
    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'roles') {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: () => Promise.resolve({ data: { role: 'user' } }),
            }),
          }),
        } as any;
      }
      if (table === 'profiles') {
        return {
          select: () => ({
            eq: () => ({
              single: () => Promise.resolve({ data: { email: 'user@example.com' } }),
            }),
          }),
        } as any;
      }
      if (table === 'institution_list') {
        return {
          select: () => ({
            eq: () => Promise.resolve({ error: 'Institution list error' }),
          }),
        } as any;
      }
      return {} as any;
    });

    const response = (await GET()) as unknown as API.Response;
    expect(response.data).toEqual({ error: 'Internal error' });
    expect(response.init?.status).toBe(500);
  });

  it('should return institutions and catalogs for a valid user', async () => {
    const institutionsData = [
      {
        id: 'inst1',
        name: 'Inst One',
        acronym: 'I1',
        catalogs: [
          { id: 'cat1', name: 'Cat 1', acronym: 'C1' },
          { id: 'cat2', name: 'Cat 2', acronym: 'C2' },
        ],
      },
      {
        id: 'inst2',
        name: 'Inst Two',
        acronym: 'I2',
        catalogs: [
          { id: 'cat3', name: 'Cat 3', acronym: 'C3' },
        ],
      },
    ];

    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'user-6' } } });
    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'roles') {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: () => Promise.resolve({ data: { role: 'user' } }),
            }),
          }),
        } as any;
      }
      if (table === 'profiles') {
        return {
          select: () => ({
            eq: () => ({
              single: () => Promise.resolve({ data: { email: 'user@example.com' } }),
            }),
          }),
        } as any;
      }
      if (table === 'institution_list') {
        return {
          select: () => ({
            eq: () => Promise.resolve({ data: [
              { institution_id: 'inst1' },
              { institution_id: 'inst2' },
            ] }),
          }),
        } as any;
      }
      if (table === 'institutions') {
        return {
          select: () => ({
            in: (_col: string, _ids: string[]) => Promise.resolve({ data: institutionsData }),
          }),
        } as any;
      }
      return {} as any;
    });

    const response = (await GET()) as unknown as API.Response;
    expect(response.data).toEqual(institutionsData);
    expect(response.init?.status).toBe(200);
  });

  it('should return 500 if fetching institutions fails', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'user-7' } } });
    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'roles') {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: () => Promise.resolve({ data: { role: 'user' } }),
            }),
          }),
        } as any;
      }
      if (table === 'profiles') {
        return {
          select: () => ({
            eq: () => ({
              single: () => Promise.resolve({ data: { email: 'user@example.com' } }),
            }),
          }),
        } as any;
      }
      if (table === 'institution_list') {
        return {
          select: () => ({
            eq: () => Promise.resolve({ data: [ { institution_id: 'inst1' } ] }),
          }),
        } as any;
      }
      if (table === 'institutions') {
        return {
          select: () => ({
            in: (_col: string, _ids: string[]) => Promise.resolve({ error: 'Institutions error' }),
          }),
        } as any;
      }
      return {} as any;
    });

    const response = (await GET()) as unknown as API.Response;
    expect(response.data).toEqual({ error: 'Internal error' });
    expect(response.init?.status).toBe(500);
  });
});
