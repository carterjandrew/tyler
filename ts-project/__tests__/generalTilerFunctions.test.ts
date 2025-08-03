import { euDist } from '../src/generalTilerFunctions';

describe('euDist', () => {
  it('calculates manhattan distance between two points', () => {
    const p1 = { x: 0, y: 0 } as any;
    const p2 = { x: 3, y: 4 } as any;
    expect(euDist(p1, p2)).toBe(7);
  });
});
