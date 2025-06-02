import { createClient } from '@/utils/supabase/server';

// Mock the Supabase client to prevent actual network calls during tests
jest.mock('@/utils/supabase/server', () => ({
  createClient: jest.fn(() => ({
    // Mock any methods you expect to call on the client
    // For a simple connection check, we might just need the client object itself
    // or a basic method like auth.getUser if you planned to check authentication.
    auth: {
      getUser: jest.fn().mockResolvedValue({ data: { user: null }, error: null }),
    },
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
    })),
    // Add other mocks as needed for your tests
  })),
}));

describe('Supabase Client Initialization', () => {
  it('should be able to create a Supabase client', async () => {
    // Attempt to create the client
    let supabaseClient;
    try {
      supabaseClient = await createClient();
    } catch (error) {
      // If createClient throws an error, the test should fail
      fail('createClient threw an error: ' + error);
    }

    // Assert that the client was created (i.e., createClient did not throw)
    expect(supabaseClient).toBeDefined();
    expect(createClient).toHaveBeenCalled();

    // You could add more checks here, e.g., if you expect specific methods to exist
    expect(supabaseClient.auth).toBeDefined();
    expect(supabaseClient.from).toBeDefined();
  });

  // You can add more tests here to verify specific Supabase interactions
  // using the mocked client, e.g., testing authentication checks or queries.
}); 