/**
 * Reader Memory is a monotonic set of knowledge flags shared across runs.
 * Values intentionally have no meaning beyond `true`.
 */
export type ReaderMemory = Record<string, true>
