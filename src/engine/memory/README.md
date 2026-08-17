# Reader Memory

Reader Memory is a generic Engine concept: a monotonic set of knowledge flags
that survives a New Run. It is deliberately separate from World State, which
describes the current run and is reset for a New Run.

Reader Memory only supports `Record<string, true>`. The Engine exposes the
`readerRemembers` condition and `remember` effect; there is no forget or reset
API. Reader UI preferences and Reader location are separate concerns and do
not belong to Reader Memory.
