export class WorkspaceMock {
  activeWindow: any = null;
}

export function createWindow() {
  return {
    dock: false,
    toolbar: false,
    menu: false,
    desktopWindow: false,
    dialog: false,
    splash: false,
    utility: false,
    dropdownMenu: false,
    popupMenu: false,
    popupWindow: false,
    notification: false,
    criticalNotification: false,
    dndIcon: false,
    modal: false,
    minimized: false,
    fullScreen: false,
    normalWindow: true,
    frameGeometry: { x: 0, y: 0, width: 100, height: 100 },
    minSize: { width: 100, height: 100 },
    noBorder: true,
    keepAbove: false
  } as any;
}
