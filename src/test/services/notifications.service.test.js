import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getMyNotifications,
  getMyNotificationsPaginated,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
} from '../../services/notifications/notifications.service';
import API from '../../api/api';

vi.mock('../../api/api', () => ({ default: { get: vi.fn(), patch: vi.fn(), delete: vi.fn() } }));

beforeEach(() => vi.clearAllMocks());

// ─── getMyNotifications ───────────────────────────────────────────────────────
describe('getMyNotifications', () => {
  it('retorna un array cuando el servidor responde con array', async () => {
    const mock = [{ id: 1, message: 'Nueva reseña' }, { id: 2, message: 'Rating crítico' }];
    API.get.mockResolvedValue({ data: mock });

    const result = await getMyNotifications();

    expect(API.get).toHaveBeenCalledWith('/notifications/my', { params: { page: 1, limit: 20 } });
    expect(result).toEqual(mock);
  });

  it('retorna data cuando el servidor responde con objeto paginado', async () => {
    const mock = { data: [{ id: 1 }], total: 1 };
    API.get.mockResolvedValue({ data: mock });

    const result = await getMyNotifications();

    expect(result).toEqual([{ id: 1 }]);
  });

  it('retorna array vacío si la respuesta no tiene data', async () => {
    API.get.mockResolvedValue({ data: {} });

    const result = await getMyNotifications();

    expect(result).toEqual([]);
  });

  it('usa los parámetros de paginación personalizados', async () => {
    API.get.mockResolvedValue({ data: [] });

    await getMyNotifications({ page: 3, limit: 5 });

    expect(API.get).toHaveBeenCalledWith('/notifications/my', { params: { page: 3, limit: 5 } });
  });
});

// ─── getMyNotificationsPaginated ──────────────────────────────────────────────
describe('getMyNotificationsPaginated', () => {
  it('retorna estructura paginada cuando el servidor responde con array', async () => {
    const mock = [{ id: 1 }, { id: 2 }];
    API.get.mockResolvedValue({ data: mock });

    const result = await getMyNotificationsPaginated({ page: 1, limit: 10 });

    expect(result).toEqual({ data: mock, total: 2, page: 1, limit: 10 });
  });

  it('retorna estructura paginada cuando el servidor responde con objeto', async () => {
    const mock = { data: [{ id: 1 }], total: 50, page: 2, limit: 10 };
    API.get.mockResolvedValue({ data: mock });

    const result = await getMyNotificationsPaginated({ page: 2, limit: 10 });

    expect(result).toEqual(mock);
  });

  it('usa valores por defecto page=1 y limit=10', async () => {
    API.get.mockResolvedValue({ data: [] });

    await getMyNotificationsPaginated();

    expect(API.get).toHaveBeenCalledWith('/notifications/my', { params: { page: 1, limit: 10 } });
  });
});

// ─── markNotificationRead ─────────────────────────────────────────────────────
describe('markNotificationRead', () => {
  it('llama al endpoint correcto con el id de la notificación', async () => {
    API.patch.mockResolvedValue({ data: { success: true } });

    const result = await markNotificationRead(42);

    expect(API.patch).toHaveBeenCalledWith('/notifications/42/read');
    expect(result).toEqual({ success: true });
  });
});

// ─── markAllNotificationsRead ─────────────────────────────────────────────────
describe('markAllNotificationsRead', () => {
  it('llama al endpoint correcto para marcar todas como leídas', async () => {
    API.patch.mockResolvedValue({ data: { updated: 5 } });

    const result = await markAllNotificationsRead();

    expect(API.patch).toHaveBeenCalledWith('/notifications/read-all');
    expect(result).toEqual({ updated: 5 });
  });
});

// ─── deleteNotification ───────────────────────────────────────────────────────
describe('deleteNotification', () => {
  it('elimina la notificación correcta por id', async () => {
    API.delete.mockResolvedValue({ data: { deleted: true } });

    const result = await deleteNotification(7);

    expect(API.delete).toHaveBeenCalledWith('/notifications/7');
    expect(result).toEqual({ deleted: true });
  });
});
