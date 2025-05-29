import { createClient } from '@/utils/supabase/server';
import { GET } from '@/app/api/admin/catalogs/route';
import { NextResponse } from 'next/server';

// Mock Supabase client
jest.mock('@/utils/supabase/server', () => ({
  createClient: jest.fn(),
}));

describe('GET /api/admin/catalogs', () => {
  let mockSupabase: any;

  beforeEach(() => {
    // Reset all mocks before each test
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

    const request = new Request('http://localhost:3000/api/admin/catalogs?institution=inst1');
    const response = await GET(request) as unknown as API.Response;
    expect(response.data).toEqual({ error: 'Not authorized ' });
    expect(response.status).toBe(401);
  });

  it('should return 401 if user is not an admin', async () => {
    // Mock authenticated user but not admin
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'user123' } } });
    mockSupabase.from.mockImplementation(() => ({
      select: () => ({
        eq: () => ({
          maybeSingle: () => Promise.resolve({ data: { role: 'user' } }),
        }),
      }),
    }));

    const request = new Request('http://localhost:3000/api/admin/catalogs?institution=inst1');
    const response = await GET(request) as unknown as API.Response;
    expect(response.data).toEqual({ error: 'Not authorized ' });
    expect(response.status).toBe(401);
  });

  it('should return 400 if institution ID is missing', async () => {
    // Mock authenticated admin user
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'user123' } } });
    mockSupabase.from.mockImplementation(() => ({
      select: () => ({
        eq: () => ({
          maybeSingle: () => Promise.resolve({ data: { role: 'admin' } }),
        }),
      }),
    }));

    const request = new Request('http://localhost:3000/api/admin/catalogs');
    const response = await GET(request) as unknown as API.Response;
    expect(response.data).toEqual({ error: 'Missing institution ID' });
    expect(response.status).toBe(400);
  });

  it('should return 500 if database error occurs', async () => {
    // Mock authenticated admin user
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'user123' } } });
    
    // Mock roles query and database error
    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'roles') {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: () => Promise.resolve({ data: { role: 'admin' } }),
            }),
          }),
        };
      } else if (table === 'catalogs') {
        return {
          select: () => ({
            eq: () => Promise.resolve({ error: 'Database error' }),
          }),
        };
      }
    });

    const request = new Request('http://localhost:3000/api/admin/catalogs?institution=inst1');
    const response = await GET(request) as unknown as API.Response;
    expect(response.data).toEqual({ error: 'Internal error' });
    expect(response.status).toBe(500);
  });
}); 