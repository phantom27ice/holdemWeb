import type {
  JoinTableRequest,
  JoinTableResponse,
  LobbyTableSummary,
  TableSnapshot,
  UserProfile,
} from '../model'
import type { ApiResponse } from './common'

/** 游客登录请求，可按需带设备标识。 */
export interface GuestLoginRequest {
  nickname?: string
  deviceId?: string
}

/** 游客登录响应。 */
export interface GuestLoginResponse {
  token: string
  profile: UserProfile
}

/** 大厅桌子列表响应。 */
export interface GetTablesResponse {
  tables: LobbyTableSummary[]
}

/** 拉大厅桌子列表时的请求参数。第一版先保持为空。 */
export interface GetTablesRequest {}

/** 入桌 HTTP 请求，复用大厅选座对象。 */
export type JoinTableHttpRequest = JoinTableRequest

/** 入桌 HTTP 响应，返回固定 seatNo 和连接信息。 */
export type JoinTableHttpResponse = JoinTableResponse

/** 拉取全量牌桌快照时的请求参数。 */
export interface GetTableSnapshotRequest {
  tableId: string
}

/** 拉取全量牌桌快照的响应。 */
export interface GetTableSnapshotResponse {
  snapshot: TableSnapshot
}

/** 下面这些别名是为了让上层直接拿来当接口合同使用。 */
export type GuestLoginApiResponse = ApiResponse<GuestLoginResponse>
export type GetTablesApiResponse = ApiResponse<GetTablesResponse>
export type JoinTableApiResponse = ApiResponse<JoinTableHttpResponse>
export type GetTableSnapshotApiResponse = ApiResponse<GetTableSnapshotResponse>
