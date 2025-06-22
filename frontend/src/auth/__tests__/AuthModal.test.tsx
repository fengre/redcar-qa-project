import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AuthModal } from '../AuthModal';

// Mock useAuth
const mockLogin = jest.fn();
const mockRegister = jest.fn();
jest.mock('../AuthContext', () => ({
  useAuth: () => ({
    login: mockLogin,
    register: mockRegister,
  }),
}));

beforeAll(() => {
  jest.spyOn(console, 'log').mockImplementation(() => {});
  jest.spyOn(console, 'warn').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterAll(() => {
  (console.log as jest.Mock).mockRestore();
  (console.warn as jest.Mock).mockRestore();
  (console.error as jest.Mock).mockRestore();
});

describe('AuthModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders login form by default', () => {
    render(<AuthModal />);
    expect(screen.getByRole('heading', { name: 'Login' })).toBeInTheDocument();
    expect(screen.getByLabelText('Username')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Login' })).toBeInTheDocument();
  });

  it('switches to register form', () => {
    render(<AuthModal />);
    fireEvent.click(screen.getByText(/don\'t have an account/i));
    expect(screen.getByRole('heading', { name: 'Register' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Register' })).toBeInTheDocument();
  });

  it('calls login on submit', async () => {
    mockLogin.mockResolvedValueOnce(undefined);
    render(<AuthModal />);
    fireEvent.change(screen.getByLabelText('Username'), { target: { value: 'user1' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'pass1' } });
    fireEvent.click(screen.getByRole('button', { name: 'Login' }));
    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('user1', 'pass1');
    });
  });

  it('calls register on submit', async () => {
    mockRegister.mockResolvedValueOnce(undefined);
    render(<AuthModal />);
    fireEvent.click(screen.getByText(/don\'t have an account/i));
    fireEvent.change(screen.getByLabelText('Username'), { target: { value: 'user2' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'pass2' } });
    fireEvent.click(screen.getByRole('button', { name: 'Register' }));
    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith('user2', 'pass2');
    });
  });

  it('shows error message from thrown error (plain)', async () => {
    mockLogin.mockRejectedValueOnce(new Error('Invalid credentials'));
    render(<AuthModal />);
    fireEvent.change(screen.getByLabelText('Username'), { target: { value: 'user3' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'pass3' } });
    fireEvent.click(screen.getByRole('button', { name: 'Login' }));
    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
    });
  });

  it('shows error message from thrown error (JSON message)', async () => {
    mockLogin.mockRejectedValueOnce(new Error(JSON.stringify({ message: 'User not found' })));
    render(<AuthModal />);
    fireEvent.change(screen.getByLabelText('Username'), { target: { value: 'user4' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'pass4' } });
    fireEvent.click(screen.getByRole('button', { name: 'Login' }));
    await waitFor(() => {
      expect(screen.getByText('User not found')).toBeInTheDocument();
    });
  });

  it('shows loading state on submit', async () => {
    let resolvePromise: (value?: unknown) => void = () => {};
    mockLogin.mockImplementation(
      () => new Promise((resolve) => { resolvePromise = resolve; })
    );
    render(<AuthModal />);
    fireEvent.change(screen.getByLabelText('Username'), { target: { value: 'user5' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'pass5' } });
    fireEvent.click(screen.getByRole('button', { name: 'Login' }));
    expect(screen.getByRole('button', { name: 'Loading...' })).toBeDisabled();
    // Finish the promise
    resolvePromise();
    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalled();
    });
  });

  it('clears error and fields when switching modes', async () => {
    mockLogin.mockRejectedValueOnce(new Error('Invalid credentials'));
    render(<AuthModal />);
    fireEvent.change(screen.getByLabelText('Username'), { target: { value: 'user6' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'pass6' } });
    fireEvent.click(screen.getByRole('button', { name: 'Login' }));
    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText(/don\'t have an account/i));
    expect(screen.queryByText('Invalid credentials')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Username')).toHaveValue('');
    expect(screen.getByLabelText('Password')).toHaveValue('');
  });
}); 