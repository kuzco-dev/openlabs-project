import { createClient } from '@/utils/supabase/server';
import { GET } from '@/app/api/admin/items/route';
import { NextResponse } from 'next/server';

jest.mock('@/utils/supabase/server', () => ({
  createClient: jest.fn(),
}));

describe('GET /api/admin/items', () => {
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

    const request = new Request('http://localhost:3000/api/admin/items?catalog=cat1');
    const response = await GET(request) as unknown as API.Response;
    expect(response.data).toEqual({ error: 'Not authorized' });
    expect(response.init?.status).toBe(401);
  });

  it('should return 401 if user is not an admin', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: '87d07bb3-a0c9-4b1e-983e-f9de348416be' } } });
    mockSupabase.from.mockImplementation(() => ({
      select: () => ({
        eq: () => ({
          maybeSingle: () => Promise.resolve({ error: 'Not authorized' }),
        }),
      }),
    }));

    const request = new Request('http://localhost:3000/api/admin/items?catalog=cat1');
    const response = await GET(request) as unknown as API.Response;
    expect(response.data).toEqual({ error: 'Not authorized' });
    expect(response.init?.status).toBe(401);
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

    const request = new Request('http://localhost:3000/api/admin/items');
    const response = await GET(request) as unknown as API.Response;
    expect(response.data).toEqual({ error: 'Missing catalog ID' });
    expect(response.init?.status).toBe(400);
  });

  it('should return items for a valid admin user with items', async () => {
    const mockItems = [
      {
        "id": "f1fbe667-3024-4a4b-9b8c-b7554df82dee",
        "name": "ITEM-TEST",
        "description": "item test",
        "default_quantity": 10,
        "created_at": "2025-08-06T17:27:34.417696+00:00",
        "catalog_id": "b2db9fb6-e08e-43ef-ac73-a3f818f703c6",
        "actual_quantity": 10
      }
    ];

    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: '97411251-3996-499b-b81b-aaafe3f675cc' } } });
    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'roles') {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: () => Promise.resolve({ data: { role: 'admin' } }),
            }),
          }),
        };
      } else if (table === 'items') {
        return {
          select: () => ({
            eq: () => Promise.resolve({ data: mockItems }),
          }),
        };
      }
    });

    const request = new Request('http://localhost:3000/api/admin/items?catalog=b2db9fb6-e08e-43ef-ac73-a3f818f703c6');
    const response = await GET(request) as unknown as API.Response;
    expect(response.data).toEqual(mockItems);
    expect(response.init?.status).toBe(200);
  });
});
