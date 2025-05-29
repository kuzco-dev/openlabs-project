import { createClient } from '@/utils/supabase/server';
import { GET } from '@/app/api/admin/orders/route';
import { NextResponse } from 'next/server';

jest.mock('@/utils/supabase/server', () => ({
  createClient: jest.fn(),
}));

describe('GET /api/admin/orders', () => {
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

    const request = new Request('http://localhost:3000/api/admin/orders?catalog=cat1');
    const response = await GET(request) as unknown as API.Response;
    expect(response.data).toEqual({ error: 'Not authorized' });
    expect(response.status).toBe(401);
  });

  it('should return 401 if user is not an admin', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: '87d07bb3-a0c9-4b1e-983e-f9de348416be' } } });
    mockSupabase.from.mockImplementation(() => ({
      select: () => ({
        eq: () => ({
          maybeSingle: () => Promise.resolve({ data: { role: 'user' } }),
        }),
      }),
    }));

    const request = new Request('http://localhost:3000/api/admin/orders?catalog=cat1');
    const response = await GET(request) as unknown as API.Response;
    expect(response.data).toEqual({ error: 'Not authorized' });
    expect(response.status).toBe(401);
  });

  it('should return 400 if catalog ID is missing', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: '87d07bb3-a0c9-4b1e-983e-f9de348416be' } } });
    mockSupabase.from.mockImplementation(() => ({
      select: () => ({
        eq: () => ({
          maybeSingle: () => Promise.resolve({ data: { role: 'admin' } }),
        }),
      }),
    }));

    const request = new Request('http://localhost:3000/api/admin/orders');
    const response = await GET(request) as unknown as API.Response;
    expect(response.data).toEqual({ error: 'Missing catalog ID' });
    expect(response.status).toBe(400);
  });
}); 