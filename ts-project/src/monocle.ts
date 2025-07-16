import QRect from '../node_modules/kwin-api/src/qt/qrect'
import Workspace from '../node_modules/kwin-api/src/workspace'
import { Tiler, TilerContextInterface } from './tilerTypes'

declare const workspace: Workspace

export default class Monocle implements Tiler {
	ctx: TilerContextInterface
	constructor(ctx: TilerContextInterface) {
		this.ctx = ctx
	}
	tile(): void {
		this.ctx.tiledWindows.forEach(window => {
			window.ref.frameGeometry = this.ctx.workspaceGeometry
			window.ref.noBorder = true
		})
		const windowRef = this.ctx.getCurrentWindow()
		if (windowRef !== undefined) {
			workspace.raiseWindow(windowRef.ref)
			workspace.activeWindow = windowRef.ref
		}
	}
	focusLeft(): void {
		const windowList = (
			this.ctx.focusedFloating ? this.ctx.floatingWindows : this.ctx.tiledWindows
		)
		this.ctx.focusedIndex -= 1
		if (this.ctx.focusedIndex < 0) this.ctx.focusedIndex = windowList.length - 1
		this.tile()
	}
	focusRight(): void {
		const windowList = (
			this.ctx.focusedFloating ? this.ctx.floatingWindows : this.ctx.tiledWindows
		)
		this.ctx.focusedIndex += 1
		this.ctx.focusedIndex %= windowList.length
		this.tile
	}
	focusUp(): void {
		this.focusLeft()
	}
	focusDown(): void {
		this.focusRight()
	}
	moveUp(): void {
		if (this.ctx.focusedFloating) this.ctx.moveFloatingWindowUp()
	}
	moveDown(): void {
		if (this.ctx.focusedFloating) this.ctx.moveFloatingWindowDown()
	}
	moveLeft(): void {
		if (this.ctx.focusedFloating) this.ctx.moveFloatingWindowLeft()
	}
	moveRight(): void {
		if (this.ctx.focusedFloating) this.ctx.moveFloatingWindowRight()
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
