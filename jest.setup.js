// Optional: configure or set up a testing framework before each test.
// If you delete this file, remove `setupFilesAfterEnv` from `jest.config.js`

// Mock environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = 'test-url';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-key';
process.env.ALLURE_API_KEY = 'test-key';
process.env.ALLURE_BASE_URL = 'test-url';