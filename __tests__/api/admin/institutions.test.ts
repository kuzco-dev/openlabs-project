import { createClient } from '@/utils/supabase/server';
import { GET } from '@/app/api/admin/institutions/route';

// Mock Supabase client
jest.mock('@/utils/supabase/server', () => ({
  createClient: jest.fn(),
}));

describe('GET /api/admin/institutions', () => {
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

    const response = await GET();
    expect(response.data).toEqual({ error: 'error' });
  });

  it('should return institutions for authenticated user', async () => {
    // Mock authenticated user
    const mockUser = { id: 'user123' };
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser } });

    // Mock institutions data
    const mockInstitutions = [
      { id: 'inst1', name: 'Institution 1' },
      { id: 'inst2', name: 'Institution 2' },
    ];
    mockSupabase.from.mockImplementation(() => ({
      select: () => ({
        eq: () => Promise.resolve({ data: mockInstitutions }),
      }),
    }));

    const response = await GET();
    expect(response.data).toEqual(mockInstitutions);
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

    await expect(GET()).rejects.toThrow('Database error');
  });
}); 