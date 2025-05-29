import { createClient } from '@/utils/supabase/server';
import { GET } from '@/app/api/user/items/route';
import { NextResponse } from 'next/server';

jest.mock('@/utils/supabase/server', () => ({
  createClient: jest.fn(),
}));

describe('GET /api/user/items', () => {
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

    const request = new Request('http://localhost:3000/api/user/items?catalog_id=cat1');
    const response = await GET(request) as unknown as API.Response;
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

    const request = new Request('http://localhost:3000/api/user/items?catalog_id=cat1');
    const response = await GET(request) as unknown as API.Response;
    expect(response.data).toEqual({ error: 'Not authorized' });
    expect(response.init?.status).toBe(401);
  });

  it('should return 400 if catalog ID is missing', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: '6d65c85b-4996-49c0-adb1-2f603437dec0' } } });
    mockSupabase.from.mockImplementation(() => ({
      select: () => ({
        eq: () => ({
          maybeSingle: () => Promise.resolve({ data: { role: 'user' } }),
        }),
      }),
    }));

    const request = new Request('http://localhost:3000/api/user/items');
    const response = await GET(request) as unknown as API.Response;
    expect(response.data).toEqual({ error: 'Missing catalog ID' });
    expect(response.init?.status).toBe(400);
  });

}); 