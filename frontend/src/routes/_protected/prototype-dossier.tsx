import { createFileRoute } from '@tanstack/react-router'
import { DossierPrototypePage } from '../../pages/prototype-dossier'

export const Route = createFileRoute('/_protected/prototype-dossier')({
 component: DossierPrototypePage,
})







