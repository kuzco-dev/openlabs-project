import { createClient } from '@/utils/supabase/server';
import { GET } from '@/app/api/admin/orders/route';

// Mock Supabase client
jest.mock('@/utils/supabase/server', () => ({
  createClient: jest.fn(),
}));

describe('GET /api/admin/orders', () => {
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
    };

    (createClient as jest.Mock).mockResolvedValue(mockSupabase);
  });

  it('should return 401 if user is not authenticated', async () => {
    // Mock unauthenticated user
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } });

    const request = new Request('http://localhost:3000/api/admin/orders');
    const response = await GET(request);
    expect(response.data).toEqual({ error: 'Non autorisé' });
    expect(response.init?.status).toBe(401);
  });

  it('should return 400 if catalog ID is missing', async () => {
    // Mock authenticated user
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'user123' } } });

    const request = new Request('http://localhost:3000/api/admin/orders');
    const response = await GET(request);
    expect(response.data).toEqual({ error: 'ID de catalogue manquant' });
    expect(response.init?.status).toBe(400);
  });

  it('should return orders for authenticated user and valid catalog', async () => {
    // Mock authenticated user
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'user123' } } });

    // Mock orders data
    const mockOrders = [
      {
        id: 'order1',
        status: 'pending',
        created_at: '2024-03-20T10:00:00Z',
        end_date: '2024-03-25T10:00:00Z',
        user_id: 'user1',
      },
    ];

    // Mock order items count
    const mockOrderItemsCount = { count: 3 };

    mockSupabase.from.mockImplementation((table) => {
      if (table === 'orders') {
        return {
          select: () => ({
            eq: () => Promise.resolve({ data: mockOrders }),
          }),
        };
      } else if (table === 'order_items') {
        return {
          select: () => ({
            eq: () => Promise.resolve(mockOrderItemsCount),
          }),
        };
      }
    });

    const request = new Request('http://localhost:3000/api/admin/orders?catalog=cat1');
    const response = await GET(request);
    
    // Verify the response structure
    expect(response.data).toHaveLength(1);
    expect(response.data[0]).toHaveProperty('id', 'order1');
    expect(response.data[0]).toHaveProperty('n_items', 3);
  });

  it('should handle database errors', async () => {
    // Mock authenticated user
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'user123' } } });

    // Mock database error
    mockSupabase.from.mockImplementation(() => ({
      select: () => ({
        eq: () => Promise.reject(new Error('Database error')),
      }),
    }));

    const request = new Request('http://localhost:3000/api/admin/orders?catalog=cat1');
    await expect(GET(request)).rejects.toThrow('Database error');
  });
}); 