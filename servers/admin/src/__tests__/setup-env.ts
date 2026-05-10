if (Bun.env.NODE_ENV === 'test') {
  Bun.env.DATABASE_URL = Bun.env.TEST_DATABASE_URL;
}
