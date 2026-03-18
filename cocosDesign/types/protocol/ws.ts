import type { ActionRejected, ActionRequest, SeatState, TableEvent, TableSnapshot } from '../model'
import type { WsClientMessageType, WsServerMessageType } from './common'

/** WebSocket 的统一消息信封。 */
export interface WsEnvelope<TType extends string, TPayload> {
  type: TType
  payload: TPayload
  requestId?: string
  ts?: number
}

/** 客户端消息信封。requestId 对可追踪消息建议总是带上。 */
export interface ClientWsEnvelope<TType extends WsClientMessageType, TPayload>
  extends WsEnvelope<TType, TPayload> {}

/** 服务端消息信封。 */
export interface ServerWsEnvelope<TType extends WsServerMessageType, TPayload>
  extends WsEnvelope<TType, TPayload> {}

/** 订阅某张桌子的消息体。 */
export interface TableSubscribePayload {
  tableId: string
}

/** 发送准备状态。 */
export interface TableReadyPayload {
  tableId: string
}

/** 离座或站起。 */
export interface TableStandPayload {
  tableId: string
}

/** 心跳消息。 */
export interface PingPayload {
  ts: number
}

/** 某个座位发生变化时的推送载荷。 */
export interface TablePlayerUpdatePayload {
  tableId: string
  seat: SeatState
}

export type TableSubscribeMessage = ClientWsEnvelope<'table.subscribe', TableSubscribePayload>

export type TableReadyMessage = ClientWsEnvelope<'table.ready', TableReadyPayload>

export type TableStandMessage = ClientWsEnvelope<'table.stand', TableStandPayload>

export type TableActionMessage = ClientWsEnvelope<'table.action', ActionRequest>

export type PingMessage = ClientWsEnvelope<'ping', PingPayload>

export type TableSnapshotMessage = ServerWsEnvelope<'table.snapshot', TableSnapshot>

export type TableEventMessage = ServerWsEnvelope<'table.event', TableEvent>

export type TableActionRejectedMessage = ServerWsEnvelope<'table.actionRejected', ActionRejected>

export type TablePlayerUpdateMessage = ServerWsEnvelope<'table.playerUpdate', TablePlayerUpdatePayload>

export type PongMessage = ServerWsEnvelope<'pong', PingPayload>

export type ClientWsMessage =
  | TableSubscribeMessage
  | TableReadyMessage
  | TableStandMessage
  | TableActionMessage
  | PingMessage

/** 服务端推给客户端的消息联合类型。 */
export type ServerWsMessage =
  | TableSnapshotMessage
  | TableEventMessage
  | TableActionRejectedMessage
  | TablePlayerUpdateMessage
  | PongMessage
