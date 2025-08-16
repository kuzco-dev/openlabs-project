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

    const request = new Request('http://localhost:3000/api/user/items?catalog_id=cat1');
    const response = (await GET(request)) as unknown as API.Response;
    expect(response.data).toEqual({ error: 'Not authorized' });
    expect(response.init?.status).toBe(401);
  });

  it('should return 500 if items query fails', async () => {
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
      if (table === 'items') {
        return {
          select: () => ({
            eq: () => Promise.resolve({ error: 'Items error' }),
          }),
        } as any;
      }
      return {} as any;
    });

    const request = new Request('http://localhost:3000/api/user/items?catalog_id=cat1');
    const response = (await GET(request)) as unknown as API.Response;
    expect(response.data).toEqual({ error: 'Internal error' });
    expect(response.init?.status).toBe(500);
  });

  it('should return items with image_url for a valid user and catalog', async () => {
    const mockItems = [
      { id: 'i1', name: 'Item 1', description: 'D1', default_quantity: 1, actual_quantity: 1, created_at: '2024-01-01', catalog_id: 'cat1' },
      { id: 'i2', name: 'Item 2', description: 'D2', default_quantity: 2, actual_quantity: 2, created_at: '2024-01-02', catalog_id: 'cat1' },
    ];

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
      if (table === 'items') {
        return {
          select: () => ({
            eq: () => Promise.resolve({ data: mockItems }),
          }),
        } as any;
      }
      return {} as any;
    });

    const request = new Request('http://localhost:3000/api/user/items?catalog_id=cat1');
    const response = (await GET(request)) as unknown as API.Response;
    const expected = mockItems.map((item) => ({
      ...item,
      image_url: `https://nlksqlrtcnecvdzrgmyd.supabase.co/storage/v1/object/public/items/${item.id}.jpg`,
    }));
    expect(response.data).toEqual(expected);
    expect(response.init?.status).toBe(200);
  });

  it('should return empty array when no items are found', async () => {
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
      if (table === 'items') {
        return {
          select: () => ({
            eq: () => Promise.resolve({ data: [] }),
          }),
        } as any;
      }
      return {} as any;
    });

    const request = new Request('http://localhost:3000/api/user/items?catalog_id=cat1');
    const response = (await GET(request)) as unknown as API.Response;
    expect(response.data).toEqual([]);
    expect(response.init?.status).toBe(200);
  });

}); 