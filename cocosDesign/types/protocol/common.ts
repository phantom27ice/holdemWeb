/**
 * HTTP 接口路径常量。
 * 这里先按当前联机德州 MVP 的接口集合收敛，不做多余接口扩展。
 */
export const HTTP_API_PATHS = {
  guestLogin: '/api/login/guest',
  getTables: '/api/tables',
  joinTable: '/api/tables/{tableId}/join',
  getTableSnapshot: '/api/tables/{tableId}/snapshot',
} as const

/**
 * 客户端发给服务端的 WebSocket 消息类型。
 */
export const WS_CLIENT_MESSAGE_TYPES = {
  subscribe: 'table.subscribe',
  ready: 'table.ready',
  stand: 'table.stand',
  action: 'table.action',
  ping: 'ping',
} as const

/**
 * 服务端推给客户端的 WebSocket 消息类型。
 */
export const WS_SERVER_MESSAGE_TYPES = {
  snapshot: 'table.snapshot',
  event: 'table.event',
  actionRejected: 'table.actionRejected',
  playerUpdate: 'table.playerUpdate',
  pong: 'pong',
} as const

export type HttpApiPath = (typeof HTTP_API_PATHS)[keyof typeof HTTP_API_PATHS]

export type WsClientMessageType =
  (typeof WS_CLIENT_MESSAGE_TYPES)[keyof typeof WS_CLIENT_MESSAGE_TYPES]

export type WsServerMessageType =
  (typeof WS_SERVER_MESSAGE_TYPES)[keyof typeof WS_SERVER_MESSAGE_TYPES]

/**
 * 联机德州第一版建议统一使用的业务错误码。
 * HTTP 和 WebSocket 都可以复用这一套。
 */
export type ApiErrorCode =
  | 'UNAUTHORIZED'
  | 'TABLE_NOT_FOUND'
  | 'TABLE_CLOSED'
  | 'SEAT_OCCUPIED'
  | 'INVALID_BUY_IN'
  | 'NOT_YOUR_TURN'
  | 'INVALID_AMOUNT'
  | 'ACTION_NOT_ALLOWED'
  | 'VERSION_EXPIRED'
  | 'HAND_ALREADY_FINISHED'

/** 成功响应。 */
export interface ApiSuccessResponse<T> {
  code: 0
  message: string
  data: T
}

/** 失败响应。 */
export interface ApiErrorResponse<E extends string = ApiErrorCode> {
  code: number
  message: string
  data: null
  error: {
    code: E
    details?: Record<string, unknown>
  }
}

/** 通用 HTTP 返回包装。 */
export type ApiResponse<T, E extends string = ApiErrorCode> =
  | ApiSuccessResponse<T>
  | ApiErrorResponse<E>
