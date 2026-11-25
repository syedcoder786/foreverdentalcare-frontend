import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/FormField';
import { StatusBadge } from '../components/ui/StatusBadge';
import { ErrorMessage } from '../components/ui/Alert';
import { ServiceCard } from '../components/services/ServiceCard';
import { renderWithProviders } from './utils';
import { formatFee, formatTime, formatWorkingDays } from '../utils/format';

describe('Button', () => {
  it('calls onClick', async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Save</Button>);
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('is disabled and busy while loading', async () => {
    const onClick = vi.fn();
    render(
      <Button loading onClick={onClick}>
        Save
      </Button>,
    );
    const btn = screen.getByRole('button', { name: /save/i });
    expect(btn).toBeDisabled();
    expect(btn).toHaveAttribute('aria-busy', 'true');
    await userEvent.click(btn);
    expect(onClick).not.toHaveBeenCalled();
  });
});

describe('Input', () => {
  it('links the label and announces errors', () => {
    render(<Input label="Phone" error="Invalid phone" />);
    const input = screen.getByLabelText('Phone');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByRole('alert')).toHaveTextContent('Invalid phone');
  });
});

describe('StatusBadge', () => {
  it('shows a human label', () => {
    render(<StatusBadge status="PENDING" />);
    expect(screen.getByText('Pending')).toBeInTheDocument();
  });
});

describe('ErrorMessage', () => {
  it('offers retry', async () => {
    const onRetry = vi.fn();
    render(<ErrorMessage message="Failed to load" onRetry={onRetry} />);
    await userEvent.click(screen.getByRole('button', { name: /try again/i }));
    expect(onRetry).toHaveBeenCalled();
  });
});

describe('ServiceCard', () => {
  it('renders service info and a booking link', () => {
    renderWithProviders(
      <ServiceCard
        variant="detailed"
        service={{
          id: 7,
          name: 'Teeth Cleaning',
          description: 'Scaling and polishing',
          details: ['Removal of plaque'],
          icon: 'sparkles',
          consultationFee: null,
          estimatedDuration: 45,
          displayOrder: 1,
          active: true,
          slug: 'teeth-cleaning',
          specialty: { id: 1, name: 'Dentistry', slug: 'dentistry' },
          doctors: [{ id: 3, fullName: 'Dr. A', slug: 'dr-a' }],
        }}
      />,
    );
    expect(screen.getByRole('heading', { name: 'Teeth Cleaning' })).toBeInTheDocument();
    expect(screen.getByText('Removal of plaque')).toBeInTheDocument();
    expect(screen.getByText('Discussed at consultation')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /book teeth cleaning/i })).toHaveAttribute('href', '/book?specialty=dentistry&service=teeth-cleaning&doctor=dr-a');
  });
});

describe('format helpers', () => {
  it('formats times and working days', () => {
    expect(formatTime('14:30')).toBe('2:30 PM');
    expect(formatTime('00:15')).toBe('12:15 AM');
    expect(formatWorkingDays(['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'])).toBe('Mon - Sat');
    expect(formatWorkingDays(['MONDAY', 'WEDNESDAY'])).toBe('Mon, Wed');
    expect(formatWorkingDays([])).toBe('Closed');
  });

  it('formats missing fee', () => {
    expect(formatFee(undefined)).toBe('Discussed at consultation');
  });
});
