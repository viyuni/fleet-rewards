export interface AuthPayload {
  /**
   * 登录账号 ID
   */
  id: string;

  /**
   * 登录账号角色
   *
   * 默认为 `user` (undefined)
   */
  role?: 'user' | 'admin' | 'superAdmin';
}
