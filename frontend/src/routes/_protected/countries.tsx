import { createFileRoute } from '@tanstack/react-router'
import Countries from '../../pages/Countries'

export const Route = createFileRoute('/_protected/countries')({
  component: Countries,
})
