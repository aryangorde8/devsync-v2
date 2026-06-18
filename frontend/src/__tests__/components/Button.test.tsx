/**
 * Button Component Tests
 * Example test file demonstrating React Testing Library usage
 */

import { render, screen, fireEvent } from '@testing-library/react';

// Simple Button component for testing
function Button({ 
  children, 
  onClick, 
  disabled = false,
  variant = 'primary' 
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'danger';
}) {
  const baseClasses = 'px-4 py-2 rounded font-medium transition-colors';
  const variantClasses = {
    primary: 'bg-purple-600 text-white hover:bg-purple-700',
    secondary: 'bg-slate-600 text-white hover:bg-slate-700',
    danger: 'bg-red-600 text-white hover:bg-red-700',
  };
  
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variantClasses[variant]} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      data-testid="button"
    >
      {children}
    </button>
  );
}

describe('Button Component', () => {
  it('renders with children', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    
    fireEvent.click(screen.getByTestId('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('does not call onClick when disabled', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick} disabled>Click me</Button>);
    
    fireEvent.click(screen.getByTestId('button'));
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('renders with different variants', () => {
    const { rerender } = render(<Button variant="primary">Primary</Button>);
    expect(screen.getByTestId('button')).toHaveClass('bg-purple-600');

    rerender(<Button variant="secondary">Secondary</Button>);
    expect(screen.getByTestId('button')).toHaveClass('bg-slate-600');

    rerender(<Button variant="danger">Danger</Button>);
    expect(screen.getByTestId('button')).toHaveClass('bg-red-600');
  });

  it('applies disabled styles when disabled', () => {
    render(<Button disabled>Disabled</Button>);
    expect(screen.getByTestId('button')).toHaveClass('opacity-50');
    expect(screen.getByTestId('button')).toBeDisabled();
  });
});
