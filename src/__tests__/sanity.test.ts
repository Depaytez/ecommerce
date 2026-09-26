import { describe, it, expect } from 'vitest';

describe('Sanity & Configuration Test', () => {
  it('correctly loads environment and executes unit assertion', () => {
    expect(true).toBe(true);
  });

  it('validates currency calculation math', () => {
    const subtotal = 10000;
    const taxRate = 0.075;
    const tax = subtotal * taxRate;
    const shipping = 2500;
    const total = subtotal + tax + shipping;

    expect(tax).toBe(750);
    expect(total).toBe(13250);
  });
});
