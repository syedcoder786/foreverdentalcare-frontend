import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider } from '../context/ThemeContext';
import { ThemeToggle } from '../components/ui/ThemeToggle';

function renderToggle() {
  return render(
    <ThemeProvider>
      <ThemeToggle />
    </ThemeProvider>,
  );
}

describe('theme switching', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('dark');
  });

  it('starts in light mode when the OS has no dark preference', () => {
    renderToggle();
    expect(document.documentElement).not.toHaveClass('dark');
    expect(screen.getByRole('button', { name: /switch to dark theme/i })).toHaveAttribute('aria-pressed', 'false');
  });

  it('toggles dark mode on <html> and remembers the choice', async () => {
    renderToggle();
    await userEvent.click(screen.getByRole('button', { name: /switch to dark theme/i }));

    expect(document.documentElement).toHaveClass('dark');
    expect(localStorage.getItem('theme')).toBe('dark');
    expect(screen.getByRole('button', { name: /switch to light theme/i })).toHaveAttribute('aria-pressed', 'true');

    await userEvent.click(screen.getByRole('button', { name: /switch to light theme/i }));
    expect(document.documentElement).not.toHaveClass('dark');
    expect(localStorage.getItem('theme')).toBe('light');
  });

  it('restores a saved dark preference', () => {
    localStorage.setItem('theme', 'dark');
    renderToggle();
    expect(document.documentElement).toHaveClass('dark');
  });
});
