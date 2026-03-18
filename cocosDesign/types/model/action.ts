import type { ActionType } from './common'

/** 服务端下发给当前行动玩家的合法动作集合。 */
export interface LegalAction {
  type: ActionType
  toCall?: number
  minAmountTo?: number
  maxAmountTo?: number
}

/** 客户端动作请求，只表达意图，不表达规则真值。 */
export interface ActionRequest {
  requestId: string
  tableId: string
  handId: number
  expectedVersion: number
  action: ActionType
  amountTo?: number
}

/** 动作被拒绝时的错误码。 */
export type ActionRejectedCode =
  | 'NOT_YOUR_TURN'
  | 'INVALID_AMOUNT'
  | 'ACTION_NOT_ALLOWED'
  | 'VERSION_EXPIRED'
  | 'HAND_ALREADY_FINISHED'
  | 'TABLE_NOT_FOUND'

/** 服务端对非法动作的拒绝响应。 */
export interface ActionRejected {
  requestId: string
  tableId: string
  handId: number
  code: ActionRejectedCode
  message: string
  latestVersion?: number
}
