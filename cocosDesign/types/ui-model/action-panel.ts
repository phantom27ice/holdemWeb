import type { ActionType } from '../model'

/** 快捷加注按钮。 */
export interface QuickRaiseOption {
  key: string
  label: string
  amountTo: number
}

/** 加注滑条状态。 */
export interface RaiseSliderState {
  minAmountTo: number
  maxAmountTo: number
  selectedAmountTo: number
  quickOptions: QuickRaiseOption[]
}

/** 单个操作按钮的显示状态。 */
export interface ActionButtonState {
  type: ActionType
  label: string
  disabled: boolean
}

/** ActionPanelPrefab 直接消费的完整状态。 */
export interface ActionPanelState {
  isVisible: boolean
  isLocked: boolean
  foldButton: ActionButtonState
  callOrCheckButton: ActionButtonState
  raiseButton: ActionButtonState
  allInButton: ActionButtonState
  raiseSlider?: RaiseSliderState
}
