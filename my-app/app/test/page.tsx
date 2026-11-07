import { redirect } from 'next/navigation'
import ConnectionTestClient from './ConnectionTestClient'

export default function ConnectionTest() {
  if (process.env.NODE_ENV === 'production') {
    redirect('/')
  }

  return <ConnectionTestClient />
}
