import { focusDown, focusLeft, focusRight, focusUp } from './generalTilerFunctions'
import QRect from '../node_modules/kwin-api/src/qt/qrect'
import Window from '../node_modules/kwin-api/src/window'
import Workspace from '../node_modules/kwin-api/src/workspace'
import { TiledWindowRef, Tiler } from './tilerTypes'

declare const workspace: Workspace

export default class Spiral implements Tiler {
	currentIndex: number
	windows: TiledWindowRef[]
	workspaceGeometry: QRect
	splits: number[]
	splitMoveAmount: number
	constructor(windows: Window[], workspaceGeometry: QRect) {
		this.currentIndex = 0
		this.windows = windows.map((window, index) => ({
			ref: window,
			floating: false,
			idealIndex: index
		}))
		this.workspaceGeometry = workspaceGeometry
		this.splits = []
		this.splitMoveAmount = 10
	}
	addWindow(window: Window): void {
		this.windows.push({
			ref: window,
			idealIndex: this.windows.length,
			floating: false
		})
		this.tile()
	}
	addWindowRef(window: TiledWindowRef): void {
		this.windows.splice(window.idealIndex, 0, window)
		this.tile()
	}
	removeWindow(window: Window): void {
		this.windows = this.windows.filter(w => w.ref !== window)
		if (this.currentIndex === this.windows.length) this.currentIndex -= 1
		this.tile()
	}
	tile(): void {
		const windows = this.windows.filter(w => !w.floating)
		windows.map(w => w.ref.frameGeometry = this.workspaceGeometry)
	}
	focusUp(): void {
		this.currentIndex = focusUp(this.windows, this.currentIndex)
		this.tile()
	}
	focusDown(): void {
		this.currentIndex = focusDown(this.windows, this.currentIndex)
		this.tile()
	}
	focusLeft(): void {
		this.currentIndex = focusLeft(this.windows, this.currentIndex)
		this.tile()
	}
	focusRight(): void {
		this.currentIndex = focusRight(this.windows, this.currentIndex)
		this.tile()
	}
	toggleFloat(): void {
		this.windows[this.currentIndex].floating = !this.windows[this.currentIndex].floating
		this.tile()
	}
}
