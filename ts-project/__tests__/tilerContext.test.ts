import { TilerContext } from '../src/tilerTypes';
import { WorkspaceMock, createWindow } from '../test/workspaceMock';

describe('TilerContext', () => {
  beforeEach(() => {
    (globalThis as any).workspace = new WorkspaceMock();
  });

  it('moves window between tiled and floating and updates activeWindow', () => {
    const win = createWindow();
    (globalThis as any).workspace.activeWindow = win;
    const geom = { x: 0, y: 0, width: 800, height: 600 } as any;
    const ctx = new TilerContext([win as any], geom);
    expect(ctx.tiledWindows).toHaveLength(1);
    ctx.toggleFloat();
    expect(ctx.floatingWindows).toHaveLength(1);
    expect(ctx.tiledWindows).toHaveLength(0);
    ctx.postTile();
    expect((globalThis as any).workspace.activeWindow).toBe(win);
  });
});
