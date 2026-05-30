import { describe, it, expect, vi, beforeEach } from 'vitest';
import { login, registerUser, requestPasswordReset, resendPasswordReset, resetPassword } from '../../services/auth/auth.service';
import API from '../../api/api';

vi.mock('../../api/api', () => ({ default: { post: vi.fn() } }));

beforeEach(() => vi.clearAllMocks());

// ─── login ────────────────────────────────────────────────────────────────────
describe('login', () => {
  it('retorna token y usuario con credenciales correctas', async () => {
    const mock = { token: 'abc123', user: { id: 1, email: 'test@eco.com' } };
    API.post.mockResolvedValue({ data: mock });

    const result = await login({ email: 'test@eco.com', password: '1234' });

    expect(API.post).toHaveBeenCalledWith('/auth/login', { email: 'test@eco.com', password: '1234' });
    expect(result).toEqual(mock);
  });

  it('lanza el error del servidor con credenciales incorrectas', async () => {
    API.post.mockRejectedValue({ response: { data: { message: 'Credenciales inválidas' } } });

    await expect(login({ email: 'x@x.com', password: 'wrong' }))
      .rejects.toEqual({ message: 'Credenciales inválidas' });
  });

  it('lanza mensaje genérico si el servidor no responde', async () => {
    API.post.mockRejectedValue({});

    await expect(login({ email: 'x@x.com', password: 'wrong' }))
      .rejects.toEqual({ message: 'Error en el login' });
  });
});

// ─── registerUser ─────────────────────────────────────────────────────────────
describe('registerUser', () => {
  it('retorna el usuario creado correctamente', async () => {
    const newUser = { id: 2, email: 'nuevo@eco.com' };
    API.post.mockResolvedValue({ data: newUser });

    const result = await registerUser({ email: 'nuevo@eco.com', password: 'pass123', nombre: 'Ana' });

    expect(API.post).toHaveBeenCalledWith('/auth/register', expect.objectContaining({ email: 'nuevo@eco.com' }));
    expect(result).toEqual(newUser);
  });

  it('lanza error si el email ya está registrado', async () => {
    API.post.mockRejectedValue({ response: { data: { message: 'El email ya existe' } } });

    await expect(registerUser({ email: 'duplicado@eco.com', password: '123' }))
      .rejects.toEqual({ message: 'El email ya existe' });
  });

  it('lanza mensaje genérico si no hay respuesta del servidor', async () => {
    API.post.mockRejectedValue({});

    await expect(registerUser({ email: 'a@a.com', password: '123' }))
      .rejects.toEqual({ message: 'Error en registro' });
  });
});

// ─── requestPasswordReset ─────────────────────────────────────────────────────
describe('requestPasswordReset', () => {
  it('llama al endpoint correcto con el email', async () => {
    API.post.mockResolvedValue({ data: { message: 'Correo enviado' } });

    const result = await requestPasswordReset('user@eco.com');

    expect(API.post).toHaveBeenCalledWith('/auth/request-password-reset', { email: 'user@eco.com' });
    expect(result).toEqual({ message: 'Correo enviado' });
  });

  it('lanza error si el email no está registrado', async () => {
    API.post.mockRejectedValue({ response: { data: { message: 'Email no encontrado' } } });

    await expect(requestPasswordReset('noexiste@eco.com'))
      .rejects.toEqual({ message: 'Email no encontrado' });
  });
});

// ─── resendPasswordReset ──────────────────────────────────────────────────────
describe('resendPasswordReset', () => {
  it('reenvía el código OTP correctamente', async () => {
    API.post.mockResolvedValue({ data: { message: 'Código reenviado' } });

    const result = await resendPasswordReset('user@eco.com');

    expect(API.post).toHaveBeenCalledWith('/auth/resend-password-reset', { email: 'user@eco.com' });
    expect(result).toEqual({ message: 'Código reenviado' });
  });

  it('lanza error genérico si falla el reenvío', async () => {
    API.post.mockRejectedValue({});

    await expect(resendPasswordReset('user@eco.com'))
      .rejects.toEqual({ message: 'Error al reenviar el código' });
  });
});

// ─── resetPassword ────────────────────────────────────────────────────────────
describe('resetPassword', () => {
  it('restablece la contraseña con OTP válido', async () => {
    API.post.mockResolvedValue({ data: { message: 'Contraseña restablecida' } });

    const result = await resetPassword('123456', 'nuevaPass123');

    expect(API.post).toHaveBeenCalledWith('/auth/reset-password', { otp: '123456', newPassword: 'nuevaPass123' });
    expect(result).toEqual({ message: 'Contraseña restablecida' });
  });

  it('lanza error con OTP inválido o expirado', async () => {
    API.post.mockRejectedValue({ response: { data: { message: 'OTP inválido o expirado' } } });

    await expect(resetPassword('000000', 'pass'))
      .rejects.toEqual({ message: 'OTP inválido o expirado' });
  });
});
