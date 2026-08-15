export class StoryRuntimeError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'StoryRuntimeError'
  }
}
