import { createClient } from '@/utils/supabase/server';
import { GET } from '@/app/api/user/institutions/route';
import { NextResponse } from 'next/server';

// Mock Supabase client
jest.mock('@/utils/supabase/server', () => ({
  createClient: jest.fn(),
}));

describe('GET /api/user/institutions', () => {
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

  it('should return institutions list for a valid user', async () => {
    const institutions = [
      { id: 'inst1', name: 'Inst One' },
      { id: 'inst2', name: 'Inst Two' },
    ];

    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'user-1' } } });
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
      if (table === 'institutions') {
        return {
          select: () => Promise.resolve({ data: institutions }),
        } as any;
      }
      return {} as any;
    });

    const response = (await GET()) as unknown as API.Response;
    expect(response.data).toEqual(institutions);
    expect(response.init?.status).toBe(200);
  });

  it('should return empty array when there are no institutions', async () => {
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
      if (table === 'institutions') {
        return {
          select: () => Promise.resolve({ data: [] }),
        } as any;
      }
      return {} as any;
    });

    const response = (await GET()) as unknown as API.Response;
    expect(response.data).toEqual([]);
    expect(response.init?.status).toBe(200);
  });
});
