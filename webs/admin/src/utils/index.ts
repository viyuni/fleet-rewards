function resolveErrorMessage(error: unknown, fallback = '请求失败喵😒') {
  if (typeof error === 'string' && error.trim()) {
    return error;
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  if (error && typeof error === 'object') {
    const e = error as {
      value?: unknown;
      message?: unknown;
    };

    if (typeof e.message === 'string' && e.message.trim()) {
      return e.message;
    }

    const value = e.value;

    if (typeof value === 'string' && value.trim()) {
      return value;
    }

    if (value && typeof value === 'object') {
      const v = value as {
        message?: unknown;
        code?: unknown;
      };

      if (typeof v.message === 'string' && v.message.trim()) {
        return v.message;
      }

      if (typeof v.code === 'string' && v.code.trim()) {
        return v.code;
      }
    }
  }

  return fallback;
}
