import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, POST } from '@/app/api/cron/release-expired-reservations/route';
import { NextRequest } from 'next/server';
import * as serverSupabase from '@/utils/supabase/server';

vi.mock('@/utils/supabase/server', () => ({
  createServiceRoleClient: vi.fn(),
}));

describe('Cron: Release Expired Stock Reservations API Route', () => {
  const originalCronSecret = process.env.CRON_SECRET;

  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.CRON_SECRET;
  });

  it('rejects request with 401 when CRON_SECRET is set and authorization header is missing', async () => {
    process.env.CRON_SECRET = 'secret_token_123';

    const req = new NextRequest('http://localhost:3000/api/cron/release-expired-reservations', {
      method: 'GET',
    });

    const res = await GET(req);
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toContain('Unauthorized');
  });

  it('rejects request with 401 when CRON_SECRET is set and bearer token does not match', async () => {
    process.env.CRON_SECRET = 'secret_token_123';

    const req = new NextRequest('http://localhost:3000/api/cron/release-expired-reservations', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer wrong_token',
      },
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toContain('Unauthorized');
  });

  it('successfully invokes RPC and returns released count when authorized', async () => {
    process.env.CRON_SECRET = 'secret_token_123';

    const mockRpc = vi.fn().mockResolvedValue({
      data: { success: true, released_count: 5, timestamp: '2026-10-02T19:00:00Z' },
      error: null,
    });

    vi.mocked(serverSupabase.createServiceRoleClient).mockReturnValue({
      rpc: mockRpc,
    } as any);

    const req = new NextRequest('http://localhost:3000/api/cron/release-expired-reservations', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer secret_token_123',
      },
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.data.released_count).toBe(5);
    expect(mockRpc).toHaveBeenCalledWith('release_expired_stock_reservations');
  });

  it('returns 500 when database RPC returns an error', async () => {
    const mockRpc = vi.fn().mockResolvedValue({
      data: null,
      error: { message: 'Database connection error' },
    });

    vi.mocked(serverSupabase.createServiceRoleClient).mockReturnValue({
      rpc: mockRpc,
    } as any);

    const req = new NextRequest('http://localhost:3000/api/cron/release-expired-reservations', {
      method: 'GET',
    });

    const res = await GET(req);
    expect(res.status).toBe(500);
    const data = await res.json();
    expect(data.success).toBe(false);
    expect(data.error).toBe('Database connection error');
  });
});
