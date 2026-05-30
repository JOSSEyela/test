import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getBusinessReviews,
  fetchAllFollowers,
  fetchAllReviews,
  aggregateChartData,
} from '../../services/stats/stats.service';
import API from '../../api/api';

vi.mock('../../api/api', () => ({ default: { get: vi.fn() } }));

beforeEach(() => vi.clearAllMocks());

// ─── getBusinessReviews ───────────────────────────────────────────────────────
describe('getBusinessReviews', () => {
  it('retorna reseñas paginadas con parámetros por defecto', async () => {
    const mock = { data: [{ id: 1, rating: 5 }], meta: { totalItems: 1 } };
    API.get.mockResolvedValue({ data: mock });

    const result = await getBusinessReviews(2);

    expect(API.get).toHaveBeenCalledWith('/reviews/business/2', { params: { page: 1, limit: 10, order: 'DESC' } });
    expect(result).toEqual(mock);
  });

  it('incluye filtro de rating cuando se especifica', async () => {
    API.get.mockResolvedValue({ data: { data: [], meta: {} } });

    await getBusinessReviews(2, { rating: 4 });

    expect(API.get).toHaveBeenCalledWith('/reviews/business/2', { params: { page: 1, limit: 10, order: 'DESC', rating: 4 } });
  });

  it('retorna estructura vacía cuando no hay reseñas (404)', async () => {
    API.get.mockRejectedValue({ response: { status: 404 } });

    const result = await getBusinessReviews(999);

    expect(result.data).toEqual([]);
    expect(result.meta.totalItems).toBe(0);
  });

  it('relanza el error si no es 404', async () => {
    const err = { response: { status: 500 } };
    API.get.mockRejectedValue(err);

    await expect(getBusinessReviews(2)).rejects.toEqual(err);
  });
});

// ─── fetchAllFollowers ────────────────────────────────────────────────────────
describe('fetchAllFollowers', () => {
  it('retorna la lista de seguidores', async () => {
    const mock = { data: [{ id: 1 }, { id: 2 }] };
    API.get.mockResolvedValue({ data: mock });

    const result = await fetchAllFollowers();

    expect(API.get).toHaveBeenCalledWith('/follows/management/my-followers', { params: { page: 1, limit: 1000 } });
    expect(result).toEqual([{ id: 1 }, { id: 2 }]);
  });

  it('retorna array vacío si no hay seguidores (404)', async () => {
    API.get.mockRejectedValue({ response: { status: 404 } });

    const result = await fetchAllFollowers();

    expect(result).toEqual([]);
  });
});

// ─── fetchAllReviews ──────────────────────────────────────────────────────────
describe('fetchAllReviews', () => {
  it('retorna todas las reseñas del negocio', async () => {
    const mock = { data: [{ id: 1, sentiment: 'POS' }, { id: 2, sentiment: 'NEG' }] };
    API.get.mockResolvedValue({ data: mock });

    const result = await fetchAllReviews(5);

    expect(API.get).toHaveBeenCalledWith('/reviews/business/5', { params: { page: 1, limit: 1000, order: 'ASC' } });
    expect(result).toEqual(mock.data);
  });

  it('retorna array vacío si el negocio no tiene reseñas (404)', async () => {
    API.get.mockRejectedValue({ response: { status: 404 } });

    const result = await fetchAllReviews(999);

    expect(result).toEqual([]);
  });
});

// ─── aggregateChartData ───────────────────────────────────────────────────────
describe('aggregateChartData', () => {
  const makeItem = (dateStr) => ({ createdAt: dateStr });

  it('agrega correctamente los últimos 7 días', () => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    const items = [
      makeItem(today.toISOString()),
      makeItem(today.toISOString()),
      makeItem(yesterday.toISOString()),
    ];

    const result = aggregateChartData(items, 'createdAt', '7d');

    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(8); // 7 días + hoy
    const total = result.reduce((sum, b) => sum + b.valor, 0);
    expect(total).toBe(3);
  });

  it('retorna buckets con valor 0 cuando no hay items en el período', () => {
    const result = aggregateChartData([], 'createdAt', '7d');

    expect(result.every(b => b.valor === 0)).toBe(true);
  });

  it('agrega correctamente los últimos 12 meses', () => {
    const now = new Date();
    const items = [makeItem(now.toISOString()), makeItem(now.toISOString())];

    const result = aggregateChartData(items, 'createdAt', 'year');

    expect(result.length).toBe(12);
    const lastBucket = result[result.length - 1];
    expect(lastBucket.valor).toBe(2);
  });

  it('ignora items con fechas inválidas', () => {
    const items = [
      makeItem('no-es-fecha'),
      makeItem(null),
      makeItem(undefined),
      makeItem(new Date().toISOString()),
    ];

    const result = aggregateChartData(items, 'createdAt', '7d');
    const total = result.reduce((sum, b) => sum + b.valor, 0);

    expect(total).toBe(1);
  });

  it('ignora items fuera del período seleccionado', () => {
    const oldDate = new Date('2000-01-01').toISOString();
    const items = [makeItem(oldDate), makeItem(oldDate)];

    const result = aggregateChartData(items, 'createdAt', '7d');
    const total = result.reduce((sum, b) => sum + b.valor, 0);

    expect(total).toBe(0);
  });
});
