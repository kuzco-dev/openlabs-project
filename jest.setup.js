// Mock environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';

// Mock Next.js response
jest.mock('next/server', () => ({
  NextResponse: {
    json: (data, init) => ({
      data,
      init,
      status: init?.status,
    }),
  },
})); 