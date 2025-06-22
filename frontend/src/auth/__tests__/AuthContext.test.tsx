import React from 'react';
import { render, waitFor, act } from '@testing-library/react';
import { AuthProvider, useAuth } from '../AuthContext';

// Helper to render with AuthProvider
const TestComponent = ({ cb }: { cb: (auth: ReturnType<typeof useAuth>) => void }) => {
  const auth = useAuth();
  React.useEffect(() => {
    cb(auth);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth]);
  return null;
};

describe('AuthContext', () => {
  let fetchMock: jest.SpyInstance;
  let localStorageMock: Record<string, string> = {};

  beforeEach(() => {
    fetchMock = jest.spyOn(window, 'fetch');
    localStorageMock = {};
    jest.spyOn(window.localStorage.__proto__, 'getItem').mockImplementation((...args: unknown[]) => localStorageMock[String(args[0])] || null);
    jest.spyOn(window.localStorage.__proto__, 'setItem').mockImplementation((...args: unknown[]) => { localStorageMock[String(args[0])] = String(args[1]); });
    jest.spyOn(window.localStorage.__proto__, 'removeItem').mockImplementation((...args: unknown[]) => { delete localStorageMock[String(args[0])]; });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('login success sets token and user and saves to localStorage', async () => {
    const user = { id: '1', username: 'testuser', createdAt: '2024-01-01T00:00:00Z' };
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ accessToken: 'token123', user }),
    } as any);
    let authState: any;
    await act(async () => {
      render(
        <AuthProvider>
          <TestComponent cb={(a) => { authState = a; }} />
        </AuthProvider>
      );
    });
    await act(async () => {
      await authState.login('testuser', 'password');
    });
    expect(authState.token).toBe('token123');
    expect(authState.user).toEqual(user);
    expect(localStorageMock['jwt']).toBe('token123');
    expect(JSON.parse(localStorageMock['user'])).toEqual(user);
  });

  it('register success sets token and user and saves to localStorage', async () => {
    const user = { id: '2', username: 'newuser', createdAt: '2024-01-02T00:00:00Z' };
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ accessToken: 'token456', user }),
    } as any);
    let authState: any;
    await act(async () => {
      render(
        <AuthProvider>
          <TestComponent cb={(a) => { authState = a; }} />
        </AuthProvider>
      );
    });
    await act(async () => {
      await authState.register('newuser', 'password');
    });
    expect(authState.token).toBe('token456');
    expect(authState.user).toEqual(user);
    expect(localStorageMock['jwt']).toBe('token456');
    expect(JSON.parse(localStorageMock['user'])).toEqual(user);
  });

  it('login failure throws error and does not set state', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      text: async () => 'Invalid credentials',
    } as any);
    let authState: any;
    await act(async () => {
      render(
        <AuthProvider>
          <TestComponent cb={(a) => { authState = a; }} />
        </AuthProvider>
      );
    });
    await expect(authState.login('baduser', 'badpass')).rejects.toThrow('Invalid credentials');
    expect(authState.token).toBeNull();
    expect(authState.user).toBeNull();
    expect(localStorageMock['jwt']).toBeUndefined();
    expect(localStorageMock['user']).toBeUndefined();
  });

  it('register failure throws error and does not set state', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      text: async () => 'Username taken',
    } as any);
    let authState: any;
    await act(async () => {
      render(
        <AuthProvider>
          <TestComponent cb={(a) => { authState = a; }} />
        </AuthProvider>
      );
    });
    await expect(authState.register('baduser', 'badpass')).rejects.toThrow('Username taken');
    expect(authState.token).toBeNull();
    expect(authState.user).toBeNull();
    expect(localStorageMock['jwt']).toBeUndefined();
    expect(localStorageMock['user']).toBeUndefined();
  });

  it('logout clears token, user, and localStorage', async () => {
    const user = { id: '3', username: 'logoutuser', createdAt: '2024-01-03T00:00:00Z' };
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ accessToken: 'token789', user }),
    } as any);
    let authState: any;
    await act(async () => {
      render(
        <AuthProvider>
          <TestComponent cb={(a) => { authState = a; }} />
        </AuthProvider>
      );
    });
    await act(async () => {
      await authState.login('logoutuser', 'password');
    });
    expect(authState.token).toBe('token789');
    expect(authState.user).toEqual(user);
    act(() => {
      authState.logout();
    });
    expect(authState.token).toBeNull();
    expect(authState.user).toBeNull();
    expect(localStorageMock['jwt']).toBeUndefined();
    expect(localStorageMock['user']).toBeUndefined();
  });
}); 