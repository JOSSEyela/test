import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getBusiness,
  getMyBusinesses,
  postBusiness,
  updateMyBusiness,
  deleteMyBusiness,
  requestBusinessReactivation,
  reactivateMyBusiness,
} from '../../services/business/busienss.service';
import API from '../../api/api';

vi.mock('../../api/api', () => ({ default: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() } }));

beforeEach(() => vi.clearAllMocks());

// ─── getBusiness ──────────────────────────────────────────────────────────────
describe('getBusiness', () => {
  it('retorna la lista pública de negocios', async () => {
    const mock = [{ id: 1, nombre: 'Tienda Verde' }, { id: 2, nombre: 'EcoMercado' }];
    API.get.mockResolvedValue({ data: mock });

    const result = await getBusiness();

    expect(API.get).toHaveBeenCalledWith('/business');
    expect(result).toEqual(mock);
  });

  it('lanza error si falla la petición', async () => {
    API.get.mockRejectedValue({ response: { data: { message: 'Error al obtener los negocios' } } });

    await expect(getBusiness()).rejects.toEqual({ message: 'Error al obtener los negocios' });
  });
});

// ─── getMyBusinesses ──────────────────────────────────────────────────────────
describe('getMyBusinesses', () => {
  it('retorna los negocios del dueño autenticado', async () => {
    const mock = [{ id: 3, nombre: 'Mi Negocio Eco' }];
    API.get.mockResolvedValue({ data: mock });

    const result = await getMyBusinesses();

    expect(API.get).toHaveBeenCalledWith('/business/management/my-businesses');
    expect(result).toEqual(mock);
  });

  it('lanza error si no hay negocios o el usuario no es owner', async () => {
    API.get.mockRejectedValue({ response: { data: { message: 'Error al obtener tus negocios' } } });

    await expect(getMyBusinesses()).rejects.toEqual({ message: 'Error al obtener tus negocios' });
  });
});

// ─── postBusiness ─────────────────────────────────────────────────────────────
describe('postBusiness', () => {
  it('registra un negocio nuevo correctamente', async () => {
    const newBusiness = { id: 4, nombre: 'Café Orgánico' };
    API.post.mockResolvedValue({ data: newBusiness });

    const result = await postBusiness({ nombre: 'Café Orgánico', categoria: 'Restaurante' });

    expect(API.post).toHaveBeenCalledWith('/business', { nombre: 'Café Orgánico', categoria: 'Restaurante' });
    expect(result).toEqual(newBusiness);
  });

  it('adjunta _httpStatus al error si el servidor responde con error HTTP', async () => {
    API.post.mockRejectedValue({ response: { status: 409, data: { message: 'Negocio ya existe' } } });

    await expect(postBusiness({ nombre: 'Duplicado' }))
      .rejects.toMatchObject({ message: 'Negocio ya existe', _httpStatus: 409 });
  });

  it('adjunta _httpStatus 0 si no hay respuesta del servidor', async () => {
    API.post.mockRejectedValue({});

    await expect(postBusiness({}))
      .rejects.toMatchObject({ _httpStatus: 0 });
  });
});

// ─── updateMyBusiness ─────────────────────────────────────────────────────────
describe('updateMyBusiness', () => {
  it('actualiza el negocio con los datos correctos', async () => {
    const updated = { id: 1, nombre: 'Tienda Verde Actualizada' };
    API.patch.mockResolvedValue({ data: updated });

    const result = await updateMyBusiness(1, { nombre: 'Tienda Verde Actualizada' });

    expect(API.patch).toHaveBeenCalledWith('/business/1', { nombre: 'Tienda Verde Actualizada' });
    expect(result).toEqual(updated);
  });

  it('lanza error si el negocio no pertenece al usuario', async () => {
    API.patch.mockRejectedValue({ response: { data: { message: 'No autorizado' } } });

    await expect(updateMyBusiness(99, {})).rejects.toEqual({ message: 'No autorizado' });
  });
});

// ─── deleteMyBusiness ─────────────────────────────────────────────────────────
describe('deleteMyBusiness', () => {
  it('elimina el negocio con contraseña correcta', async () => {
    API.delete.mockResolvedValue({ data: { deleted: true } });

    const result = await deleteMyBusiness(1, 'miPassword123');

    expect(API.delete).toHaveBeenCalledWith('/business/1', { data: { password: 'miPassword123' } });
    expect(result).toEqual({ deleted: true });
  });

  it('lanza error si la contraseña es incorrecta', async () => {
    API.delete.mockRejectedValue({ response: { data: { message: 'Contraseña incorrecta' } } });

    await expect(deleteMyBusiness(1, 'wrong')).rejects.toEqual({ message: 'Contraseña incorrecta' });
  });
});

// ─── requestBusinessReactivation ─────────────────────────────────────────────
describe('requestBusinessReactivation', () => {
  it('solicita la reactivación del negocio correctamente', async () => {
    API.patch.mockResolvedValue({ data: { status: 'Pending' } });

    const result = await requestBusinessReactivation(5);

    expect(API.patch).toHaveBeenCalledWith('/business/5/request-reactivation');
    expect(result).toEqual({ status: 'Pending' });
  });
});

// ─── reactivateMyBusiness ─────────────────────────────────────────────────────
describe('reactivateMyBusiness', () => {
  it('reactiva el negocio correctamente', async () => {
    API.patch.mockResolvedValue({ data: { status: 'Active' } });

    const result = await reactivateMyBusiness(5);

    expect(API.patch).toHaveBeenCalledWith('/business/5/reactivate');
    expect(result).toEqual({ status: 'Active' });
  });
});
