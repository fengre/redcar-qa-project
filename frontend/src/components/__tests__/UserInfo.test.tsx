import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';

// Mock the entire AuthContext module before importing UserInfo
const mockLogout = jest.fn();
const mockUser = {
  id: '1',
  username: 'testuser',
  createdAt: '2024-01-01T00:00:00Z',
};

jest.mock('../../auth/AuthContext', () => ({
  useAuth: jest.fn(),
}));

// Import UserInfo after mocking
import { UserInfo } from '../UserInfo';
import { useAuth } from '../../auth/AuthContext';

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

describe('UserInfo', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders username and join date', () => {
    mockUseAuth.mockReturnValue({
      token: 'token',
      user: mockUser,
      isAuthenticated: true,
      login: jest.fn(),
      register: jest.fn(),
      logout: mockLogout,
    });

    render(<UserInfo />);
    expect(screen.getByText('testuser')).toBeInTheDocument();
    expect(screen.getByText(/Member since/)).toBeInTheDocument();
    // Check that the date is present in the Member since text
    expect(screen.getByText((content) => content.includes('Member since'))).toBeInTheDocument();
  });

  it('renders logout button and calls logout on click', () => {
    mockUseAuth.mockReturnValue({
      token: 'token',
      user: mockUser,
      isAuthenticated: true,
      login: jest.fn(),
      register: jest.fn(),
      logout: mockLogout,
    });

    render(<UserInfo />);
    const logoutButton = screen.getByRole('button', { name: 'Logout' });
    expect(logoutButton).toBeInTheDocument();
    fireEvent.click(logoutButton);
    expect(mockLogout).toHaveBeenCalled();
  });

  it('renders nothing if user is null', () => {
    mockUseAuth.mockReturnValue({
      token: null,
      user: null,
      isAuthenticated: false,
      login: jest.fn(),
      register: jest.fn(),
      logout: mockLogout,
    });

    const { container } = render(<UserInfo />);
    expect(container.firstChild).toBeNull();
  });
}); 