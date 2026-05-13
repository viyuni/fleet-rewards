if (Bun.env.NODE_ENV === 'test') {
  // 避免读取环境变量时报错
  Bun.env.DATABASE_URL = Bun.env.TEST_DATABASE_URL;
}
