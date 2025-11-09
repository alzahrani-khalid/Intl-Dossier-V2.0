import { createFileRoute } from '@tanstack/react-router'
import DataLibrary from '../../pages/DataLibrary'

export const Route = createFileRoute('/_protected/data-library')({
 component: DataLibrary,
})
