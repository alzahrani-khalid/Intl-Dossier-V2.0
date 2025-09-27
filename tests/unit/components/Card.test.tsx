import { render, screen } from '@testing-library/react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../../../frontend/src/components/ui/card'

// Mock the utils function
vi.mock('../../../frontend/src/lib/utils', () => ({
  cn: (...classes: (string | undefined)[]) => classes.filter(Boolean).join(' ')
}))

describe('Card Components', () => {
  describe('Card', () => {
    it('renders with default props', () => {
      render(<Card>Card content</Card>)
      
      const card = screen.getByText('Card content').closest('div')
      expect(card).toBeInTheDocument()
      expect(card).toHaveClass('rounded-lg', 'border', 'bg-card', 'text-card-foreground', 'shadow-sm')
    })

    it('applies custom className', () => {
      render(<Card className="custom-class">Card content</Card>)
      
      const card = screen.getByText('Card content').closest('div')
      expect(card).toHaveClass('custom-class')
    })

    it('forwards ref correctly', () => {
      const ref = vi.fn()
      render(<Card ref={ref}>Card content</Card>)
      
      expect(ref).toHaveBeenCalled()
    })

    it('spreads additional props', () => {
      render(<Card data-testid="test-card">Card content</Card>)
      
      const card = screen.getByTestId('test-card')
      expect(card).toBeInTheDocument()
    })
  })

  describe('CardHeader', () => {
    it('renders with default props', () => {
      render(
        <Card>
          <CardHeader>Header content</CardHeader>
        </Card>
      )
      
      const header = screen.getByText('Header content').closest('div')
      expect(header).toHaveClass('flex', 'flex-col', 'space-y-1.5', 'p-6')
    })

    it('applies custom className', () => {
      render(
        <Card>
          <CardHeader className="custom-header">Header content</CardHeader>
        </Card>
      )
      
      const header = screen.getByText('Header content').closest('div')
      expect(header).toHaveClass('custom-header')
    })
  })

  describe('CardTitle', () => {
    it('renders with default props', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Card Title</CardTitle>
          </CardHeader>
        </Card>
      )
      
      const title = screen.getByText('Card Title')
      expect(title).toHaveClass('text-2xl', 'font-semibold', 'leading-none', 'tracking-tight')
    })

    it('renders as different element when asChild is true', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle asChild>
              <h1>Card Title</h1>
            </CardTitle>
          </CardHeader>
        </Card>
      )
      
      const title = screen.getByRole('heading', { level: 1 })
      expect(title).toHaveTextContent('Card Title')
    })

    it('applies custom className', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle className="custom-title">Card Title</CardTitle>
          </CardHeader>
        </Card>
      )
      
      const title = screen.getByText('Card Title')
      expect(title).toHaveClass('custom-title')
    })
  })

  describe('CardDescription', () => {
    it('renders with default props', () => {
      render(
        <Card>
          <CardHeader>
            <CardDescription>Card description</CardDescription>
          </CardHeader>
        </Card>
      )
      
      const description = screen.getByText('Card description')
      expect(description).toHaveClass('text-sm', 'text-muted-foreground')
    })

    it('applies custom className', () => {
      render(
        <Card>
          <CardHeader>
            <CardDescription className="custom-description">Card description</CardDescription>
          </CardHeader>
        </Card>
      )
      
      const description = screen.getByText('Card description')
      expect(description).toHaveClass('custom-description')
    })
  })

  describe('CardContent', () => {
    it('renders with default props', () => {
      render(
        <Card>
          <CardContent>Card content</CardContent>
        </Card>
      )
      
      const content = screen.getByText('Card content').closest('div')
      expect(content).toHaveClass('p-6', 'pt-0')
    })

    it('applies custom className', () => {
      render(
        <Card>
          <CardContent className="custom-content">Card content</CardContent>
        </Card>
      )
      
      const content = screen.getByText('Card content').closest('div')
      expect(content).toHaveClass('custom-content')
    })
  })

  describe('CardFooter', () => {
    it('renders with default props', () => {
      render(
        <Card>
          <CardFooter>Footer content</CardFooter>
        </Card>
      )
      
      const footer = screen.getByText('Footer content').closest('div')
      expect(footer).toHaveClass('flex', 'items-center', 'p-6', 'pt-0')
    })

    it('applies custom className', () => {
      render(
        <Card>
          <CardFooter className="custom-footer">Footer content</CardFooter>
        </Card>
      )
      
      const footer = screen.getByText('Footer content').closest('div')
      expect(footer).toHaveClass('custom-footer')
    })
  })

  describe('Complete Card Structure', () => {
    it('renders complete card with all components', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Card Title</CardTitle>
            <CardDescription>Card description</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Card content goes here</p>
          </CardContent>
          <CardFooter>
            <button>Action</button>
          </CardFooter>
        </Card>
      )
      
      expect(screen.getByText('Card Title')).toBeInTheDocument()
      expect(screen.getByText('Card description')).toBeInTheDocument()
      expect(screen.getByText('Card content goes here')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Action' })).toBeInTheDocument()
    })

    it('handles card without header', () => {
      render(
        <Card>
          <CardContent>
            <p>Content without header</p>
          </CardContent>
        </Card>
      )
      
      expect(screen.getByText('Content without header')).toBeInTheDocument()
    })

    it('handles card without footer', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Title Only</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Content without footer</p>
          </CardContent>
        </Card>
      )
      
      expect(screen.getByText('Title Only')).toBeInTheDocument()
      expect(screen.getByText('Content without footer')).toBeInTheDocument()
    })

    it('handles empty card', () => {
      render(<Card />)
      
      const card = screen.getByRole('generic')
      expect(card).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('has proper semantic structure', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Accessible Card</CardTitle>
            <CardDescription>This card has proper semantics</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Card content</p>
          </CardContent>
        </Card>
      )
      
      const title = screen.getByText('Accessible Card')
      expect(title).toBeInTheDocument()
      
      const description = screen.getByText('This card has proper semantics')
      expect(description).toBeInTheDocument()
    })

    it('supports custom aria attributes', () => {
      render(
        <Card role="article" aria-label="Custom card">
          <CardContent>Card content</CardContent>
        </Card>
      )
      
      const card = screen.getByRole('article', { name: 'Custom card' })
      expect(card).toBeInTheDocument()
    })
  })

  describe('Styling Variants', () => {
    it('applies different card styles', () => {
      const { rerender } = render(<Card>Default card</Card>)
      
      let card = screen.getByText('Default card').closest('div')
      expect(card).toHaveClass('rounded-lg', 'border', 'bg-card')
      
      rerender(<Card className="border-2 border-blue-500">Custom styled card</Card>)
      
      card = screen.getByText('Custom styled card').closest('div')
      expect(card).toHaveClass('border-2', 'border-blue-500')
    })
  })
})
