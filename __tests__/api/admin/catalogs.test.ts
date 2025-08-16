import { createClient } from '@/utils/supabase/server';
import { GET } from '@/app/api/admin/catalogs/route';
import { NextResponse } from 'next/server';

jest.mock('@/utils/supabase/server', () => ({
  createClient: jest.fn(),
}));

describe('GET /api/admin/catalogs', () => {
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
    const request = new Request('http://localhost:3000/api/admin/catalogs?institution=inst1');
    const response = await GET(request) as unknown as API.Response;
    expect(response.data).toEqual({ error: 'Not authorized' });
    expect(response.status).toBe(401);
  });

  it('case 2 :  user is not an admin', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: '1ac713ac-c6b1-496b-8600-5370fe778022' } } });
    mockSupabase.from.mockImplementation(() => ({
      select: () => ({
        eq: () => ({
          maybeSingle: () => Promise.resolve({ error: 'Not authorized' }),
        }),
      }),
    }));

    const request = new Request('http://localhost:3000/api/admin/catalogs?institution=03fed5b2-26ca-4ab6-a130-12587a58e3d7');
    const response = await GET(request) as unknown as API.Response;
    expect(response.data).toEqual({ error: 'Not authorized' });
    expect(response.status).toBe(401);
  });


  it('case 3 : institution ID is missing', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: '97411251-3996-499b-b81b-aaafe3f675cc' } } });
    mockSupabase.from.mockImplementation(() => ({
      select: () => ({
        eq: () => ({
          maybeSingle: () => Promise.resolve({ data: { role: 'admin' } }),
        }),
      }),
    }));

    const request = new Request('http://localhost:3000/api/admin/catalogs');
    const response = await GET(request) as unknown as API.Response;
    expect(response.data).toEqual({ error: 'Missing institution ID' });
    expect(response.status).toBe(400);
  });

  it('case 4 : bad institution id', async () => {
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
      } else if (table === 'catalogs') {
        return {
          select: () => ({
            eq: () => Promise.resolve({ error: 'Internal error' }),
          }),
        };
      }
    });

    const request = new Request('http://localhost:3000/api/admin/catalogs?institution=inst1');
    const response = await GET(request) as unknown as API.Response;
    expect(response.data).toEqual({ error: 'Institution not found' });
    expect(response.status).toBe(400);
  });

  it('case 5 : good institution', async () => {
    const mockCatalogs = [
      {
        "id": "b2db9fb6-e08e-43ef-ac73-a3f818f703c6",
        "name": "CAT-TEST",
        "description": "Catalog test",
        "institution_id": "03fed5b2-26ca-4ab6-a130-12587a58e3d7",
        "created_at": "2025-08-06T17:25:33.740495+00:00",
        "acronym": "CAT-TEST"
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
      } else if (table === 'catalogs') {
        return {
          select: () => ({
            eq: () => Promise.resolve({ data: mockCatalogs }),
          }),
        };
      }
    });

    const request = new Request('http://localhost:3000/api/admin/catalogs?institution=03fed5b2-26ca-4ab6-a130-12587a58e3d7');
    const response = await GET(request) as unknown as API.Response;
    expect(response.data).toEqual(mockCatalogs);
    expect(response.status).toBe(200);
  });
});