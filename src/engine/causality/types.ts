export type StateValue = string | number | boolean | null

export type WorldState = Record<string, StateValue>

export type Condition =
  | { type: 'equals'; key: string; value: StateValue }
  | { type: 'notEquals'; key: string; value: StateValue }
  | { type: 'greaterThan'; key: string; value: number }
  | { type: 'greaterThanOrEqual'; key: string; value: number }
  | { type: 'lessThan'; key: string; value: number }
  | { type: 'lessThanOrEqual'; key: string; value: number }
  | { type: 'exists'; key: string }
  | { type: 'notExists'; key: string }
  | { type: 'hasFlag'; key: string }
  | { type: 'notFlag'; key: string }
  | { type: 'all'; conditions: Condition[] }
  | { type: 'any'; conditions: Condition[] }

export type Effect =
  | { type: 'set'; key: string; value: StateValue }
  | { type: 'increment'; key: string; amount?: number }
  | { type: 'decrement'; key: string; amount?: number }
  | { type: 'setFlag'; key: string }
  | { type: 'clearFlag'; key: string }
