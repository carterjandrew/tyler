import { QPoint, QSize, Signal, VirtualDesktop, Window } from './types'
import Workspace from '../node_modules/kwin-api/src/workspace'

/**
 * Workspace is a global object provided by KWin
 * It let's us interact with everything on our desktop
 * This includes virtual destktops and windows
 */
declare const workspace: Workspace

console.log(workspace.windowList().map(window => {
		return window.internalId
}))
