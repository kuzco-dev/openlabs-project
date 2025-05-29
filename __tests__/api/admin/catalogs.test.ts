import { createClient } from '@/utils/supabase/server';
import { GET } from '@/app/api/admin/catalogs/route';

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
    };

    (createClient as jest.Mock).mockResolvedValue(mockSupabase);
  });

  it('should return 401 if user is not authenticated', async () => {
    // Mock unauthenticated user
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } });

    const request = new Request('http://localhost:3000/api/admin/catalogs');
    const response = await GET(request);
    expect(response.data).toEqual({ error: 'Non autorisé' });
    expect(response.init?.status).toBe(401);
  });

  it('should return 400 if institution ID is missing', async () => {
    // Mock authenticated user
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'user123' } } });

    const request = new Request('http://localhost:3000/api/admin/catalogs');
    const response = await GET(request);
    expect(response.data).toEqual({ error: 'ID de l\'institution manquant' });
    expect(response.init?.status).toBe(400);
  });

  it('should return catalogs for authenticated user and valid institution', async () => {
    // Mock authenticated user
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'user123' } } });

    // Mock catalogs data
    const mockCatalogs = [
      { id: 'cat1', name: 'Catalog 1', institution_id: 'inst1' },
      { id: 'cat2', name: 'Catalog 2', institution_id: 'inst1' },
    ];
    mockSupabase.from.mockImplementation(() => ({
      select: () => ({
        eq: () => Promise.resolve({ data: mockCatalogs }),
      }),
    }));

    const request = new Request('http://localhost:3000/api/admin/catalogs?institution=inst1');
    const response = await GET(request);
    expect(response.data).toEqual(mockCatalogs);
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

    const request = new Request('http://localhost:3000/api/admin/catalogs?institution=inst1');
    await expect(GET(request)).rejects.toThrow('Database error');
  });
}); 