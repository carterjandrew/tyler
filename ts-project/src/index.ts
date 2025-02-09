import { QPoint, QSize, Signal, VirtualDesktop, Window } from './types'

/**
 * Workspace is a global object provided by KWin
 * It let's us interact with everything on our desktop
 * This includes virtual destktops and windows
 */
declare const workspace: {
	desktops: VirtualDesktop[],
	windowList: () => Window[],
	desktopGridSize: QSize,
	cursorPos: QPoint,
	currentDesktops: VirtualDesktop,
	activeWindow: Window,
	windowAdded: Signal<(window: Window) => void>,
	windowRemoved: Signal<(window: Window) => void>,
	windowActivated: Signal<(window: Window) => void>,
	currentDesktopChanged: Signal<(previous: VirtualDesktop) => void>,
	raiseWindow: (window: Window) => void
	getClient: (windowId: string) => Window
}

const trackedWindows: TiledWindowRef[] = workspace.windowList().map(window => {
		return {
				id: window.internalId,
				floating: false,
				idealOrder: 0,
				actualOrder: 0
		}
})

