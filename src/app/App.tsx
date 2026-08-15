import { BookReader } from '../reader/components/BookReader'
import { demoDocument } from '../reader/fixtures/demoDocument'

export function App() {
  return <BookReader document={demoDocument} />
}
