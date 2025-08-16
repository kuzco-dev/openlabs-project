import { createClient } from '@/utils/supabase/server';
import { GET } from '@/app/api/admin/settings/students/route';

jest.mock('@/utils/supabase/server', () => ({
  createClient: jest.fn(),
}));

describe('GET /api/admin/settings/students', () => {
  let mockSupabase: any;

  beforeEach(() => {
    jest.clearAllMocks();
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
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } });

    const request = new Request('http://localhost:3000/api/admin/settings/students?institution=inst1');
    const response = (await GET(request)) as unknown as API.Response;
    expect(response.data).toEqual({ error: 'Not authorized' });
    expect(response.init?.status).toBe(401);
  });

  it('should return 401 if user is not an admin', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'user-1' } } });
    mockSupabase.from.mockImplementation(() => ({
      select: () => ({
        eq: () => ({
          maybeSingle: () => Promise.resolve({ data: { role: 'user' } }),
        }),
      }),
    }));

    const request = new Request('http://localhost:3000/api/admin/settings/students?institution=inst1');
    const response = (await GET(request)) as unknown as API.Response;
    expect(response.data).toEqual({ error: 'Not authorized' });
    expect(response.init?.status).toBe(401);
  });

  it('should return 400 if institution ID is missing', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'user-2' } } });
    mockSupabase.from.mockImplementation(() => ({
      select: () => ({
        eq: () => ({
          maybeSingle: () => Promise.resolve({ data: { role: 'admin' } }),
        }),
      }),
    }));

    const request = new Request('http://localhost:3000/api/admin/settings/students');
    const response = (await GET(request)) as unknown as API.Response;
    expect(response.data).toEqual({ error: 'Missing institution ID' });
    expect(response.init?.status).toBe(400);
  });

  it('should return students list for a valid admin user', async () => {
    const mockStudents = [
      { id: 's1', email: 'a@example.com', created_at: '2024-01-01T00:00:00Z' },
      { id: 's2', email: 'b@example.com', created_at: '2024-01-02T00:00:00Z' },
    ];

    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'user-3' } } });
    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'roles') {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: () => Promise.resolve({ data: { role: 'admin' } }),
            }),
          }),
        } as any;
      }
      if (table === 'institution_list') {
        return {
          select: () => ({
            eq: () => Promise.resolve({ data: mockStudents }),
          }),
        } as any;
      }
      return {} as any;
    });

    const request = new Request('http://localhost:3000/api/admin/settings/students?institution=inst1');
    const response = (await GET(request)) as unknown as API.Response;
    expect(response.data).toEqual(mockStudents);
    expect(response.init?.status).toBe(200);
  });

  it('should return 500 if fetching students fails', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'user-4' } } });
    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'roles') {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: () => Promise.resolve({ data: { role: 'admin' } }),
            }),
          }),
        } as any;
      }
      if (table === 'institution_list') {
        return {
          select: () => ({
            eq: () => Promise.resolve({ error: 'Database error' }),
          }),
        } as any;
      }
      return {} as any;
    });

    const request = new Request('http://localhost:3000/api/admin/settings/students?institution=inst1');
    const response = (await GET(request)) as unknown as API.Response;
    expect(response.data).toEqual({ error: 'Internal error' });
    expect(response.init?.status).toBe(500);
  });

  it('should return 401 if roles lookup fails', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'user-5' } } });
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

    const request = new Request('http://localhost:3000/api/admin/settings/students?institution=inst1');
    const response = (await GET(request)) as unknown as API.Response;
    expect(response.data).toEqual({ error: 'Not authorized' });
    expect(response.init?.status).toBe(401);
  });
});

