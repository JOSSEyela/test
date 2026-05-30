import { describe, it, expect, vi, beforeEach } from 'vitest';
import { reportReview } from '../../services/reviews/reviews-report.service';
import API from '../../api/api';

vi.mock('../../api/api', () => ({ default: { post: vi.fn() } }));

beforeEach(() => vi.clearAllMocks());

describe('reportReview', () => {
  it('reporta una reseña con motivo sin detalles adicionales', async () => {
    API.post.mockResolvedValue({ data: { success: true } });

    const result = await reportReview(10, 'Spam o publicidad');

    expect(API.post).toHaveBeenCalledWith('/reviews/reports/10', { reason: 'Spam o publicidad' });
    expect(result).toEqual({ success: true });
  });

  it('incluye los detalles adicionales cuando se proporcionan', async () => {
    API.post.mockResolvedValue({ data: { success: true } });

    await reportReview(10, 'Otro', 'El comentario es completamente inventado');

    expect(API.post).toHaveBeenCalledWith('/reviews/reports/10', {
      reason: 'Otro',
      details: 'El comentario es completamente inventado',
    });
  });

  it('no incluye el campo details si no se pasa', async () => {
    API.post.mockResolvedValue({ data: { success: true } });

    await reportReview(10, 'Lenguaje ofensivo o inapropiado');

    const body = API.post.mock.calls[0][1];
    expect(body).not.toHaveProperty('details');
  });

  it('soporta todos los valores del enum ReportReason', async () => {
    API.post.mockResolvedValue({ data: { success: true } });

    const reasons = [
      'Lenguaje ofensivo o inapropiado',
      'Spam o publicidad',
      'Reseña falsa o no es cliente',
      'Otro',
    ];

    for (const reason of reasons) {
      await reportReview(1, reason);
      expect(API.post).toHaveBeenCalledWith('/reviews/reports/1', { reason });
    }
  });

  it('lanza el error del servidor si la petición falla', async () => {
    API.post.mockRejectedValue(new Error('Network Error'));

    await expect(reportReview(99, 'Spam o publicidad'))
      .rejects.toThrow('Network Error');
  });
});
