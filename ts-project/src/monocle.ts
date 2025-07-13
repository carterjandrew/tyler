import QRect from '../node_modules/kwin-api/src/qt/qrect'
import Window from '../node_modules/kwin-api/src/window'
import Workspace from '../node_modules/kwin-api/src/workspace'
import { BaseTiler, TiledWindowRef, Tiler } from './tilerTypes'

declare const workspace: Workspace

export default class Monocle extends BaseTiler implements Tiler {
	currentIndex: number
	workspaceGeometry: QRect
	constructor(windows: Window[], workspaceGeometry: QRect) {
		super(windows, workspaceGeometry)
		this.currentIndex = 0
		this.workspaceGeometry = workspaceGeometry
	}
	tile(): void {
		this.tiledWindows.forEach(window => {
			window.ref.frameGeometry = this.workspaceGeometry
			window.ref.noBorder = true
		})
		const windowRef = this.getCurrentWindow()
		if (windowRef !== undefined) {
			workspace.raiseWindow(windowRef.ref)
			workspace.activeWindow = windowRef.ref
		}
	}
	focusLeft(): void {
		const windowList = (
			this.focusedFloating ? this.floatingWindows : this.tiledWindows
		)
		this.currentIndex -= 1
		if (this.currentIndex < 0) this.currentIndex = windowList.length - 1
		this.tile()
	}
	focusRight(): void {
		const windowList = (
			this.focusedFloating ? this.floatingWindows : this.tiledWindows
		)
		this.currentIndex += 1
		this.currentIndex %= windowList.length
		this.tile
	}
	focusUp(): void {
		this.focusLeft()
	}
	focusDown(): void {
		this.focusRight()
	}
	removeWindow(window: Window): TiledWindowRef | undefined {
		const w = super.removeWindow(window)
		if (!w) return w
		w.ref.noBorder = false
		return w
	}
	moveUp(): void {
			if(this.focusedFloating) this.moveFloatingWindowUp()
	}
	moveDown(): void {
			if(this.focusedFloating) this.moveFloatingWindowDown()
	}
	moveLeft(): void {
			if(this.focusedFloating) this.moveFloatingWindowLeft()
	}
	moveRight(): void {
			if(this.focusedFloating) this.moveFloatingWindowRight()
	}
	windowResizeUp(): void {
	    this.moveUp()
	}
	windowResizeDown(): void {
	    this.moveDown()
	}
	windowResizeLeft(): void {
	    this.moveLeft()
	}
	windowResizeRight(): void {
	    this.moveRight()
	}
}
