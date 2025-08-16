import { createClient } from '@/utils/supabase/server';
import { GET } from '@/app/api/user/orders/route';
import { NextResponse } from 'next/server';

jest.mock('@/utils/supabase/server', () => ({
  createClient: jest.fn(),
}));

describe('GET /api/user/orders', () => {
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
      order: jest.fn().mockReturnThis(),
    };

    (createClient as jest.Mock).mockResolvedValue(mockSupabase);
  });

  it('should return 401 if user is not authenticated', async () => {
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
              maybeSingle: () => Promise.resolve({ error: 'Roles error' }),
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

  it('should return 500 if orders query fails', async () => {
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
      if (table === 'orders') {
        return {
          select: () => ({
            eq: () => ({
              order: () => Promise.resolve({ error: 'Orders query error' }),
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

  it('should return orders with catalog and items for a valid user', async () => {
    const mockOrders = [
      {
        id: 'o1',
        status: 'pending',
        created_at: '2024-01-02T00:00:00Z',
        catalog_id: 'c1',
        end_date: '2024-01-10T00:00:00Z',
        catalog: { name: 'Winter', acronym: 'W' },
        order_items: [
          { quantity: 1, item: { name: 'Item A', description: 'Desc A' } },
          { quantity: 2, item: { name: 'Item B', description: 'Desc B' } },
        ],
        latest_message: null,
      },
      {
        id: 'o2',
        status: 'completed',
        created_at: '2024-01-01T00:00:00Z',
        catalog_id: 'c2',
        end_date: '2024-01-05T00:00:00Z',
        catalog: { name: 'Autumn', acronym: 'A' },
        order_items: [],
        latest_message: null,
      },
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
      if (table === 'orders') {
        return {
          select: () => ({
            eq: () => ({
              order: () => Promise.resolve({ data: mockOrders }),
            }),
          }),
        } as any;
      }
      if (table === 'order_messages') {
        return {
          select: () => ({
            eq: () => ({
              order: () => ({
                limit: () => ({
                  single: () => Promise.resolve({ data: null }),
                }),
              }),
            }),
          }),
        } as any;
      }
      return {} as any;
    });

    const response = (await GET()) as unknown as API.Response;
    expect(response.data).toEqual(mockOrders);
    expect(response.init?.status).toBe(200);
  });

  it('should return 500 on unexpected error (catch-all)', async () => {
    // Make createClient throw for this test only
    (createClient as jest.Mock).mockRejectedValueOnce(new Error('boom'));
    const response = (await GET()) as unknown as API.Response;
    expect(response.data).toEqual({ error: 'Internal error' });
    expect(response.init?.status).toBe(500);
  });
}); 