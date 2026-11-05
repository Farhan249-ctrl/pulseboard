import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../auth/AuthContext';
import { Navbar } from '../components/Navbar';

describe('Navbar', () => {
  it('renders app title', () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <Navbar />
        </AuthProvider>
      </BrowserRouter>
    );
    expect(screen.getByText('PulseBoard')).toBeInTheDocument();
  });
});
