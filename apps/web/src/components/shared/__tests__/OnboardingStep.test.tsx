import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { OnboardingStep } from '../OnboardingStep';

describe('OnboardingStep', () => {
  const baseProps = {
    stepNumber: 2,
    total: 5,
    title: 'Connexion WhatsApp',
    status: 'active' as const,
  };

  it('renders step number and title', () => {
    render(<OnboardingStep {...baseProps} />);
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('Connexion WhatsApp')).toBeInTheDocument();
  });

  it('renders progress text "Étape X/Y"', () => {
    render(<OnboardingStep {...baseProps} />);
    expect(screen.getByText('Étape 2/5')).toBeInTheDocument();
  });

  it('completed step has correct aria-label and calls onClick', () => {
    const handler = jest.fn();
    render(<OnboardingStep {...baseProps} status="completed" onClick={handler} />);
    const card = screen.getByRole('button');
    expect(card).toHaveAttribute('aria-label', "Revenir à l'étape 2 : Connexion WhatsApp");
    fireEvent.click(card);
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('upcoming step is not clickable even with onClick', () => {
    const handler = jest.fn();
    render(<OnboardingStep {...baseProps} status="upcoming" onClick={handler} />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    const card = screen.getByText('Connexion WhatsApp').closest('[class*="card"], div, article') as HTMLElement;
    if (card) fireEvent.click(card);
    expect(handler).not.toHaveBeenCalled();
  });

  it('locked step is not clickable', () => {
    const handler = jest.fn();
    render(<OnboardingStep {...baseProps} status="locked" onClick={handler} />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('renders with status "active"', () => {
    render(<OnboardingStep {...baseProps} status="active" />);
    expect(screen.getByText('Connexion WhatsApp')).toBeInTheDocument();
  });

  it('renders with all 4 statuses without error', () => {
    const statuses = ['completed', 'active', 'upcoming', 'locked'] as const;
    statuses.forEach((status) => {
      const { unmount } = render(<OnboardingStep {...baseProps} status={status} />);
      expect(screen.getByText('Connexion WhatsApp')).toBeInTheDocument();
      unmount();
    });
  });

  it('renders progress bar with correct aria-label', () => {
    render(<OnboardingStep {...baseProps} />);
    expect(screen.getByLabelText(/Progression : étape 2 sur 5/i)).toBeInTheDocument();
  });
});
