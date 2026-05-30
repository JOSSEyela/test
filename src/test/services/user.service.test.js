import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getAllUsers,
  createUser,
  updateUser,
  toggleUserStatus,
  changeEmail,
  changePassword,
  deleteUser,
} from '../../services/user/user.service';
import API from '../../api/api';

vi.mock('../../api/api', () => ({ default: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() } }));

beforeEach(() => vi.clearAllMocks());

// ─── getAllUsers ──────────────────────────────────────────────────────────────
describe('getAllUsers', () => {
  it('retorna la lista de usuarios con parámetros por defecto', async () => {
    const mock = { data: [{ id: 1 }, { id: 2 }], total: 2 };
    API.get.mockResolvedValue({ data: mock });

    const result = await getAllUsers();

    expect(API.get).toHaveBeenCalledWith('/user?page=1&limit=15');
    expect(result).toEqual(mock);
  });

  it('incluye filtros opcionales en la query', async () => {
    API.get.mockResolvedValue({ data: [] });

    await getAllUsers({ page: 2, limit: 10, rol: 'owner', sortBy: 'nombre', order: 'ASC' });

    expect(API.get).toHaveBeenCalledWith('/user?page=2&limit=10&rol=owner&sortBy=nombre&order=ASC');
  });

  it('lanza error formateado si la petición falla', async () => {
    API.get.mockRejectedValue({ response: { data: { message: 'No autorizado' } } });

    await expect(getAllUsers()).rejects.toEqual({ message: 'No autorizado' });
  });

  it('lanza el primer mensaje si la respuesta trae un array de mensajes', async () => {
    API.get.mockRejectedValue({ response: { data: { message: ['Error 1', 'Error 2'] } } });

    await expect(getAllUsers()).rejects.toEqual({ message: 'Error 1' });
  });
});

// ─── createUser ───────────────────────────────────────────────────────────────
describe('createUser', () => {
  it('crea un usuario y retorna los datos', async () => {
    const newUser = { id: 5, email: 'admin@eco.com' };
    API.post.mockResolvedValue({ data: newUser });

    const result = await createUser({ email: 'admin@eco.com', password: '123', rol: 'admin' });

    expect(API.post).toHaveBeenCalledWith('/user', expect.objectContaining({ email: 'admin@eco.com' }));
    expect(result).toEqual(newUser);
  });

  it('lanza error si el email ya existe', async () => {
    API.post.mockRejectedValue({ response: { data: { message: 'Email ya en uso' } } });

    await expect(createUser({ email: 'dup@eco.com' })).rejects.toEqual({ message: 'Email ya en uso' });
  });
});

// ─── updateUser ───────────────────────────────────────────────────────────────
describe('updateUser', () => {
  it('actualiza el usuario por id', async () => {
    const updated = { id: 1, nombre: 'Carlos Eco' };
    API.patch.mockResolvedValue({ data: updated });

    const result = await updateUser(1, { nombre: 'Carlos Eco' });

    expect(API.patch).toHaveBeenCalledWith('/user/1', { nombre: 'Carlos Eco' });
    expect(result).toEqual(updated);
  });
});

// ─── toggleUserStatus ─────────────────────────────────────────────────────────
describe('toggleUserStatus', () => {
  it('activa un usuario correctamente', async () => {
    API.patch.mockResolvedValue({ data: { isActive: true } });

    const result = await toggleUserStatus(3, true);

    expect(API.patch).toHaveBeenCalledWith('/user/3/status', { isActive: true });
    expect(result).toEqual({ isActive: true });
  });

  it('desactiva un usuario correctamente', async () => {
    API.patch.mockResolvedValue({ data: { isActive: false } });

    const result = await toggleUserStatus(3, false);

    expect(API.patch).toHaveBeenCalledWith('/user/3/status', { isActive: false });
    expect(result).toEqual({ isActive: false });
  });
});

// ─── changeEmail ──────────────────────────────────────────────────────────────
describe('changeEmail', () => {
  it('cambia el email del usuario autenticado', async () => {
    API.patch.mockResolvedValue({ data: { message: 'Email actualizado' } });

    const result = await changeEmail({ newEmail: 'nuevo@eco.com', password: 'pass123' });

    expect(API.patch).toHaveBeenCalledWith('/user/me/email', { newEmail: 'nuevo@eco.com', password: 'pass123' });
    expect(result).toEqual({ message: 'Email actualizado' });
  });

  it('lanza error si la contraseña es incorrecta', async () => {
    API.patch.mockRejectedValue({ response: { data: { message: 'Contraseña incorrecta' } } });

    await expect(changeEmail({ newEmail: 'x@x.com', password: 'wrong' }))
      .rejects.toEqual({ message: 'Contraseña incorrecta' });
  });
});

// ─── changePassword ───────────────────────────────────────────────────────────
describe('changePassword', () => {
  it('cambia la contraseña correctamente', async () => {
    API.patch.mockResolvedValue({ data: { message: 'Contraseña actualizada' } });

    const result = await changePassword({ currentPassword: 'vieja123', newPassword: 'nueva456' });

    expect(API.patch).toHaveBeenCalledWith('/user/me/password', { currentPassword: 'vieja123', newPassword: 'nueva456' });
    expect(result).toEqual({ message: 'Contraseña actualizada' });
  });

  it('lanza error si la contraseña actual es incorrecta', async () => {
    API.patch.mockRejectedValue({ response: { data: { message: 'Contraseña actual incorrecta' } } });

    await expect(changePassword({ currentPassword: 'mal', newPassword: 'nueva' }))
      .rejects.toEqual({ message: 'Contraseña actual incorrecta' });
  });
});

// ─── deleteUser ───────────────────────────────────────────────────────────────
describe('deleteUser', () => {
  it('elimina el usuario por id', async () => {
    API.delete.mockResolvedValue({ data: { deleted: true } });

    const result = await deleteUser(8);

    expect(API.delete).toHaveBeenCalledWith('/user/8');
    expect(result).toEqual({ deleted: true });
  });

  it('lanza error si el usuario no existe', async () => {
    API.delete.mockRejectedValue({ response: { data: { message: 'Usuario no encontrado' } } });

    await expect(deleteUser(999)).rejects.toEqual({ message: 'Usuario no encontrado' });
  });
});
