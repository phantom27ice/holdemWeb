import type { UserStatus } from './common'

/** 用户基础信息，头像直接使用 HTTP 图片地址。 */
export interface UserProfile {
  userId: string
  nickname: string
  avatarUrl: string
  balance?: number
  status?: UserStatus
}
