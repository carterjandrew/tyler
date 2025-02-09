import { QPoint, QSize, Signal, VirtualDesktop, Window } from './types'
import Workspace from '../node_modules/kwin-api/src/workspace'
import { TiledWindowRef } from './tilerTypes'

/**
 * Workspace is a global object provided by KWin
 * It let's us interact with everything on our desktop
 * This includes virtual destktops and windows
 */
declare const workspace: Workspace

const trackedWindows: TiledWindowRef[] = workspace.windowList().map(window => ({
	id: window.internalId,
	desktopIndex: workspace.desktops.findIndex(desktop =>
		desktop === window.desktops[0]
	)!,
	floating: false,
	idealOrder: 0,
	actualOrder: 0
}))
