import QRect from '../node_modules/kwin-api/src/qt/qrect'
import Window from '../node_modules/kwin-api/src/window'
import Workspace from '../node_modules/kwin-api/src/workspace'
import { TiledWindowRef, Tiler } from './tilerTypes'

declare const workspace: Workspace

export default class Monocle implements Tiler {
	currentIndex: number
	windows: TiledWindowRef[]
	workspaceGeometry: QRect
	constructor(windows: Window[], workspaceGeometry: QRect) {
		this.currentIndex = 0
		this.windows = windows.map((window, index) => ({
			ref: window,
			floating: false,
			idealIndex: index
		}))
		this.workspaceGeometry = workspaceGeometry
	}
	tile(): void {
		this.windows.forEach(window => {
			window.ref.frameGeometry = this.workspaceGeometry
			window.ref.noBorder = true
		})
		workspace.raiseWindow(this.windows[this.currentIndex].ref)
	}
	focusLeft(): void {
		this.currentIndex -= 1
		if (this.currentIndex < 0) this.currentIndex = this.windows.length
		this.tile()
	}
}
