import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { Badge } from '../badge'
import { Button } from '../button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../card'
import { Input } from '../input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../table'
import { Textarea } from '../textarea'

function expectClasses(element: Element | null, ...classes: string[]): void {
  expect(element).not.toBeNull()
  for (const className of classes) {
    expect(element!.classList.contains(className)).toBe(true)
  }
}

describe('handoff primitive class hooks', () => {
  it('buttons expose the canonical handoff button classes', () => {
    render(<Button>Publish brief</Button>)

    expectClasses(screen.getByRole('button', { name: 'Publish brief' }), 'btn', 'btn-primary')
  })

  it('cards expose canonical card, header, title, description, and content hooks', () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Week ahead</CardTitle>
          <CardDescription>42 upcoming engagements</CardDescription>
        </CardHeader>
        <CardContent>Content</CardContent>
      </Card>,
    )

    expectClasses(screen.getByText('Content').closest('[data-slot="card"]'), 'card')
    expectClasses(screen.getByText('Week ahead').closest('[data-slot="card-header"]'), 'card-head')
    expectClasses(screen.getByText('Week ahead'), 'card-title')
    expectClasses(screen.getByText('42 upcoming engagements'), 'card-sub')
    expectClasses(screen.getByText('Content'), 'card-content')
  })

  it('badges, fields, and tables expose handoff-compatible hooks', () => {
    render(
      <>
        <Badge>Restricted</Badge>
        <Input aria-label="Reference" />
        <Textarea aria-label="Notes" />
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Country</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell>Saudi Arabia</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </>,
    )

    expectClasses(
      screen.getByText('Restricted').closest('[data-slot="badge"]'),
      'chip',
      'chip-accent',
    )
    expectClasses(screen.getByLabelText('Reference'), 'id-input')
    expectClasses(screen.getByLabelText('Notes'), 'id-textarea')
    expectClasses(screen.getByRole('table'), 'tbl')
  })
})
