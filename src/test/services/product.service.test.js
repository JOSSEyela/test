import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getProductsByBusiness,
  createProduct,
  updateProduct,
  deleteProduct,
} from '../../services/product/product.service';
import api from '../../api/api';

vi.mock('../../api/api', () => ({ default: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() } }));

beforeEach(() => vi.clearAllMocks());

// ─── getProductsByBusiness ────────────────────────────────────────────────────
describe('getProductsByBusiness', () => {
  it('retorna los productos de un negocio con parámetros por defecto', async () => {
    const mock = { data: [{ id: 1, nombre: 'Café orgánico' }], meta: { totalItems: 1 } };
    api.get.mockResolvedValue({ data: mock });

    const result = await getProductsByBusiness(3);

    expect(api.get).toHaveBeenCalledWith('/product/business/3', { params: { page: 1, limit: 12 } });
    expect(result).toEqual(mock);
  });

  it('incluye filtros opcionales en la petición', async () => {
    api.get.mockResolvedValue({ data: { data: [], meta: {} } });

    await getProductsByBusiness(3, { page: 2, limit: 6, search: 'té', sortBy: 'nombre', order: 'ASC' });

    expect(api.get).toHaveBeenCalledWith('/product/business/3', {
      params: { page: 2, limit: 6, search: 'té', sortBy: 'nombre', order: 'ASC' },
    });
  });

  it('retorna estructura vacía cuando el negocio no tiene productos (404)', async () => {
    api.get.mockRejectedValue({ response: { status: 404 } });

    const result = await getProductsByBusiness(999);

    expect(result).toEqual({ data: [], meta: { totalItems: 0, totalPages: 1, currentPage: 1 } });
  });

  it('relanza el error si no es 404', async () => {
    const err = { response: { status: 500 } };
    api.get.mockRejectedValue(err);

    await expect(getProductsByBusiness(3)).rejects.toEqual(err);
  });
});

// ─── createProduct ────────────────────────────────────────────────────────────
describe('createProduct', () => {
  it('crea un producto asociado al negocio correctamente', async () => {
    const newProduct = { id: 10, nombre: 'Miel artesanal' };
    api.post.mockResolvedValue({ data: newProduct });

    const result = await createProduct(3, { nombre: 'Miel artesanal', precio: 15000 });

    expect(api.post).toHaveBeenCalledWith('/product/business/3', { nombre: 'Miel artesanal', precio: 15000 });
    expect(result).toEqual(newProduct);
  });

  it('lanza error si la creación falla', async () => {
    api.post.mockRejectedValue(new Error('Error al crear'));

    await expect(createProduct(3, {})).rejects.toThrow('Error al crear');
  });
});

// ─── updateProduct ────────────────────────────────────────────────────────────
describe('updateProduct', () => {
  it('actualiza el producto correctamente', async () => {
    const updated = { id: 10, nombre: 'Miel de abejas nativas' };
    api.patch.mockResolvedValue({ data: updated });

    const result = await updateProduct(10, { nombre: 'Miel de abejas nativas' });

    expect(api.patch).toHaveBeenCalledWith('/product/10', { nombre: 'Miel de abejas nativas' });
    expect(result).toEqual(updated);
  });
});

// ─── deleteProduct ────────────────────────────────────────────────────────────
describe('deleteProduct', () => {
  it('elimina el producto por id correctamente', async () => {
    api.delete.mockResolvedValue({ data: { deleted: true } });

    const result = await deleteProduct(10);

    expect(api.delete).toHaveBeenCalledWith('/product/10');
    expect(result).toEqual({ deleted: true });
  });

  it('lanza error si el producto no existe', async () => {
    api.delete.mockRejectedValue(new Error('Producto no encontrado'));

    await expect(deleteProduct(999)).rejects.toThrow('Producto no encontrado');
  });
});
