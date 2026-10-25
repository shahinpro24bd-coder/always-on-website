import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { expect, it, vi } from 'vitest';

const { signUp, navigate } = vi.hoisted(() => ({ signUp: vi.fn(), navigate: vi.fn() }));
vi.mock('@tanstack/react-router', () => ({
  createFileRoute: () => (options: unknown) => options,
  useNavigate: () => navigate,
}));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { auth: {
  getSession: vi.fn().mockResolvedValue({ data: { session: null } }), signUp,
} } }));
vi.mock('@/integrations/lovable/index', () => ({ lovable: {} }));
vi.mock('@/components/team-brand', () => ({ TeamBrand: () => null }));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
import { Route } from '@/routes/auth';

it('opens the workspace immediately when signup returns a session without verification', async () => {
  signUp.mockResolvedValue({ data: { session: { user: { id: 'new-user' } } }, error: null });
  const Component = (Route as unknown as { component: React.ComponentType }).component;
  render(<Component />);
  fireEvent.mouseDown(screen.getByRole('tab', { name: 'Sign up' }), { button: 0, ctrlKey: false });
  fireEvent.click(screen.getByRole('tab', { name: 'Sign up' }));
  fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'signup-test@example.com' } });
  fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'test-password-only' } });
  fireEvent.submit(screen.getByRole('button', { name: 'Create account' }).closest('form') as HTMLFormElement);
  await waitFor(() => expect(navigate).toHaveBeenCalledWith({ to: '/leads' }));
  expect(signUp).toHaveBeenCalledTimes(1);
});