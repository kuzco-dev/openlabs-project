import { createClient } from '@/utils/supabase/server';
import { GET } from '@/app/api/admin/institutions/route';
import { NextResponse } from 'next/server';

jest.mock('@/utils/supabase/server', () => ({
  createClient: jest.fn(),
}));

describe('GET /api/admin/institutions', () => {
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

  it('case 1 : user is not authenticated', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } });

    const response = await GET() as unknown as API.Response;
    expect(response.data).toEqual({ error: 'Not authorized' });
    expect(response.status).toBe(401);
  });

  it('case 2 : user is not an admin', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: '87d07bb3-a0c9-4b1e-983e-f9de348416be' } } });
    mockSupabase.from.mockImplementation(() => ({
      select: () => ({
        eq: () => ({
          maybeSingle: () => Promise.resolve({ error: 'Not authorized' }),
        }),
      }),
    }));

    const response = await GET() as unknown as API.Response;
    expect(response.data).toEqual({ error: 'Not authorized' });
    expect(response.status).toBe(401);
  });


  it('should return institutions for a valid admin user with institutions', async () => {
    const mockInstitutions = [
      {
        "id": "03fed5b2-26ca-4ab6-a130-12587a58e3d7",
        "name": "INST-TEST",
        "description": "Institution de test",
        "created_at": "2025-08-06T14:36:29.884267+00:00",
        "creator_id": "97411251-3996-499b-b81b-aaafe3f675cc",
        "acronym": "INST-TEST"
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
      } else if (table === 'institutions') {
        return {
          select: () => ({
            eq: () => Promise.resolve({ data: mockInstitutions }),
          }),
        };
      }
    });

    const response = await GET() as unknown as API.Response;
    expect(response.data).toEqual(mockInstitutions);
    expect(response.status).toBe(200);
  });
}); 