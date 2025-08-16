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
    expect(response.init?.status).toBe(401);
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

    const request = new Request('http://localhost:3000/api/admin/orders');
    const response = await GET(request) as unknown as API.Response;
    expect(response.data).toEqual({ error: 'Missing catalog ID' });
    expect(response.init?.status).toBe(400);
  });

  it('should return 500 if there is an error fetching orders', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: '87d07bb3-a0c9-4b1e-983e-f9de348416be' } } });
    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'roles') {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: () => Promise.resolve({ data: { role: 'admin' } }),
            }),
          }),
        };
      } else if (table === 'orders') {
        return {
          select: () => ({
            eq: () => Promise.resolve({ error: 'Database error' }),
          }),
        };
      }
    });

    const request = new Request('http://localhost:3000/api/admin/orders?catalog=cat1');
    const response = await GET(request) as unknown as API.Response;
    expect(response.data).toEqual({ error: 'Internal error' });
    expect(response.init?.status).toBe(500);
  });

  it('should return orders successfully for a valid admin user', async () => {
    const mockOrders = [
      {
        id: 'order1',
        status: 'pending',
        created_at: '2025-01-01T00:00:00Z',
        end_date: '2025-01-31T00:00:00Z',
        user_id: 'user1'
      }
    ];

    const mockOrderItems = [
      {
        quantity: 2,
        items: { name: 'Item 1' }
      },
      {
        quantity: 1,
        items: { name: 'Item 2' }
      }
    ];

    const mockProfile = {
      email: 'user@example.com'
    };

    const mockItemTypes = [
      { id: 'type1', name: 'Type 1' },
      { id: 'type2', name: 'Type 2' }
    ];

    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: '87d07bb3-a0c9-4b1e-983e-f9de348416be' } } });
    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'roles') {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: () => Promise.resolve({ data: { role: 'admin' } }),
            }),
          }),
        };
      } else if (table === 'orders') {
        return {
          select: () => ({
            eq: () => Promise.resolve({ data: mockOrders }),
          }),
        };
      } else if (table === 'items_types') {
        return {
          select: () => ({
            eq: () => Promise.resolve({ data: mockItemTypes }),
          }),
        };
      } else if (table === 'order_items') {
        return {
          select: () => ({
            eq: () => Promise.resolve({ data: mockOrderItems }),
          }),
        };
      } else if (table === 'profiles') {
        return {
          select: () => ({
            eq: () => ({
              single: () => Promise.resolve({ data: mockProfile }),
            }),
          }),
        };
      }
    });

    const request = new Request('http://localhost:3000/api/admin/orders?catalog=cat1');
    const response = await GET(request) as unknown as API.Response;
    
    const expectedResponse = {
      orders: [
        {
          id: 'order1',
          status: 'pending',
          creation_date: '2025-01-01T00:00:00Z',
          end_date: '2025-01-31T00:00:00Z',
          validation: undefined,
          n_items: 2,
          user_email: 'user@example.com',
          items: [
            { name: 'Item 1', serial_number: null, item_type: null, quantity: 2 },
            { name: 'Item 2', serial_number: null, item_type: null, quantity: 1 }
          ]
        }
      ],
      itemTypes: mockItemTypes
    };

    expect(response.data).toEqual(expectedResponse);
    expect(response.init?.status).toBe(200);
  });


  it('should return 401 if there is an error fetching user role', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: '87d07bb3-a0c9-4b1e-983e-f9de348416be' } } });
    mockSupabase.from.mockImplementation(() => ({
      select: () => ({
        eq: () => ({
          maybeSingle: () => Promise.resolve({ error: 'Database error fetching role' }),
        }),
      }),
    }));

    const request = new Request('http://localhost:3000/api/admin/orders?catalog=cat1');
    const response = await GET(request) as unknown as API.Response;
    expect(response.data).toEqual({ error: 'Not authorized' });
    expect(response.init?.status).toBe(401);
  });

  it('should handle profile error gracefully and return orders with N/A email', async () => {
    const mockOrders = [
      {
        id: 'order1',
        status: 'pending',
        created_at: '2025-01-01T00:00:00Z',
        end_date: '2025-01-31T00:00:00Z',
        user_id: 'user1'
      }
    ];

    const mockOrderItems = [
      {
        quantity: 2,
        items: { name: 'Item 1' }
      }
    ];

    const mockItemTypes = [
      { id: 'type1', name: 'Type 1' }
    ];

    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: '87d07bb3-a0c9-4b1e-983e-f9de348416be' } } });
    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'roles') {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: () => Promise.resolve({ data: { role: 'admin' } }),
            }),
          }),
        };
      } else if (table === 'orders') {
        return {
          select: () => ({
            eq: () => Promise.resolve({ data: mockOrders }),
          }),
        };
      } else if (table === 'items_types') {
        return {
          select: () => ({
            eq: () => Promise.resolve({ data: mockItemTypes }),
          }),
        };
      } else if (table === 'order_items') {
        return {
          select: () => ({
            eq: () => Promise.resolve({ data: mockOrderItems }),
          }),
        };
      } else if (table === 'profiles') {
        return {
          select: () => ({
            eq: () => ({
              single: () => Promise.resolve({ error: 'Profile not found' }),
            }),
          }),
        };
      }
    });

    const request = new Request('http://localhost:3000/api/admin/orders?catalog=cat1');
    const response = await GET(request) as unknown as API.Response;
    
    const expectedResponse = {
      orders: [
        {
          id: 'order1',
          status: 'pending',
          creation_date: '2025-01-01T00:00:00Z',
          end_date: '2025-01-31T00:00:00Z',
          validation: undefined,
          n_items: 1,
          user_email: 'N/A',
          items: [
            { name: 'Item 1', serial_number: null, item_type: null, quantity: 2 }
          ]
        }
      ],
      itemTypes: mockItemTypes
    };

    expect(response.data).toEqual(expectedResponse);
    expect(response.init?.status).toBe(200);
  });

  it('should handle items with unknown names gracefully', async () => {
    const mockOrders = [
      {
        id: 'order1',
        status: 'pending',
        created_at: '2025-01-01T00:00:00Z',
        end_date: '2025-01-31T00:00:00Z',
        user_id: 'user1'
      }
    ];

    const mockOrderItems = [
      {
        quantity: 2,
        items: { name: null } // Simulating item with null name
      },
      {
        quantity: 1,
        items: { name: 'Item 2' }
      }
    ];

    const mockProfile = {
      email: 'user@example.com'
    };

    const mockItemTypes = [
      { id: 'type1', name: 'Type 1' }
    ];

    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: '87d07bb3-a0c9-4b1e-983e-f9de348416be' } } });
    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'roles') {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: () => Promise.resolve({ data: { role: 'admin' } }),
            }),
          }),
        };
      } else if (table === 'orders') {
        return {
          select: () => ({
            eq: () => Promise.resolve({ data: mockOrders }),
          }),
        };
      } else if (table === 'items_types') {
        return {
          select: () => ({
            eq: () => Promise.resolve({ data: mockItemTypes }),
          }),
        };
      } else if (table === 'order_items') {
        return {
          select: () => ({
            eq: () => Promise.resolve({ data: mockOrderItems }),
          }),
        };
      } else if (table === 'profiles') {
        return {
          select: () => ({
            eq: () => ({
              single: () => Promise.resolve({ data: mockProfile }),
            }),
          }),
        };
      }
    });

    const request = new Request('http://localhost:3000/api/admin/orders?catalog=cat1');
    const response = await GET(request) as unknown as API.Response;
    
    const expectedResponse = {
      orders: [
        {
          id: 'order1',
          status: 'pending',
          creation_date: '2025-01-01T00:00:00Z',
          end_date: '2025-01-31T00:00:00Z',
          validation: undefined,
          n_items: 2,
          user_email: 'user@example.com',
          items: [
            { name: 'Unknown', serial_number: null, item_type: null, quantity: 2 },
            { name: 'Item 2', serial_number: null, item_type: null, quantity: 1 }
          ]
        }
      ],
      itemTypes: mockItemTypes
    };

    expect(response.data).toEqual(expectedResponse);
    expect(response.init?.status).toBe(200);
  });

  it('should handle null/undefined orderItems and profileData gracefully', async () => {
    const mockOrders = [
      {
        id: 'order1',
        status: 'pending',
        created_at: '2025-01-01T00:00:00Z',
        end_date: '2025-01-31T00:00:00Z',
        user_id: 'user1'
      }
    ];

    const mockItemTypes = [
      { id: 'type1', name: 'Type 1' }
    ];

    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: '87d07bb3-a0c9-4b1e-983e-f9de348416be' } } });
    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'roles') {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: () => Promise.resolve({ data: { role: 'admin' } }),
            }),
          }),
        };
      } else if (table === 'orders') {
        return {
          select: () => ({
            eq: () => Promise.resolve({ data: mockOrders }),
          }),
        };
      } else if (table === 'items_types') {
        return {
          select: () => ({
            eq: () => Promise.resolve({ data: mockItemTypes }),
          }),
        };
      } else if (table === 'order_items') {
        return {
          select: () => ({
            eq: () => Promise.resolve({ data: null }), // Simulating null orderItems
          }),
        };
      } else if (table === 'profiles') {
        return {
          select: () => ({
            eq: () => ({
              single: () => Promise.resolve({ data: null }), // Simulating null profileData
            }),
          }),
        };
      }
    });

    const request = new Request('http://localhost:3000/api/admin/orders?catalog=cat1');
    const response = await GET(request) as unknown as API.Response;
    
    const expectedResponse = {
      orders: [
        {
          id: 'order1',
          status: 'pending',
          creation_date: '2025-01-01T00:00:00Z',
          end_date: '2025-01-31T00:00:00Z',
          validation: undefined,
          n_items: 0,
          user_email: 'N/A',
          items: []
        }
      ],
      itemTypes: mockItemTypes
    };

    expect(response.data).toEqual(expectedResponse);
    expect(response.init?.status).toBe(200);
  });
}); 