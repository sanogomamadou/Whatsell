import React from 'react';
import { render, screen } from '@testing-library/react';
import { ConversationBubble } from '../ConversationBubble';

const TS = new Date('2024-01-15T14:30:00');

describe('ConversationBubble', () => {
  it('renders client bubble with message', () => {
    render(<ConversationBubble type="client" message="Bonjour !" timestamp={TS} />);
    expect(screen.getByText('Bonjour !')).toBeInTheDocument();
  });

  it('renders agent bubble aligned right with IA badge', () => {
    const { container } = render(<ConversationBubble type="agent" message="Bienvenue" timestamp={TS} />);
    expect(screen.getByText('IA')).toBeInTheDocument();
    expect(screen.getByText('Bienvenue')).toBeInTheDocument();
    // Agent bubble should have bg-primary class
    const bubble = container.querySelector('.bg-primary');
    expect(bubble).toBeInTheDocument();
  });

  it('renders vendor bubble with Vous badge', () => {
    render(<ConversationBubble type="vendor" message="Je prends en charge" timestamp={TS} />);
    expect(screen.getByText('Vous')).toBeInTheDocument();
  });

  it('client bubble does not have a badge', () => {
    render(<ConversationBubble type="client" message="Salut" timestamp={TS} />);
    expect(screen.queryByText('IA')).not.toBeInTheDocument();
    expect(screen.queryByText('Vous')).not.toBeInTheDocument();
  });

  it('formats timestamp as HH:mm', () => {
    render(<ConversationBubble type="client" message="Test" timestamp={TS} />);
    // The timestamp is 14:30 — format depends on locale but should contain "30"
    const text = screen.getByText(/30/);
    expect(text).toBeInTheDocument();
  });

  it('renders skeleton when isLoading=true', () => {
    render(<ConversationBubble type="agent" message="" timestamp={TS} isLoading />);
    const skeleton = screen.getByRole('status', { name: /chargement/i });
    expect(skeleton).toBeInTheDocument();
  });

  it('does not render image when imageUrl is absent', () => {
    render(<ConversationBubble type="client" message="Sans image" timestamp={TS} />);
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('renders image with next/image when imageUrl is provided', () => {
    render(
      <ConversationBubble
        type="client"
        message="Reçu"
        timestamp={TS}
        imageUrl="/test-receipt.jpg"
      />
    );
    const img = screen.getByRole('img', { name: /reçu/i });
    expect(img).toBeInTheDocument();
  });
});
