import QPoint from '../node_modules/kwin-api/src/qt/qpoint'
import QRect from '../node_modules/kwin-api/src/qt/qrect'
import QSize from '../node_modules/kwin-api/src/qt/qsize'
import Window from '../node_modules/kwin-api/src/window'
import Workspace from '../node_modules/kwin-api/src/workspace'
import { TiledWindowRef, Tiler } from './tilerTypes'

declare const workspace: Workspace

export default class Monocle implements Tiler {
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
		console.log(`Current index: ${this.currentIndex}`)
		this.windows.push({
			ref: window,
			idealIndex: this.windows.length,
			floating: false
		})
		this.currentIndex = this.windows.length - 1
		this.tile()
	}
	addWindowRef(window: TiledWindowRef): void {
		if (window.idealIndex < this.windows.length) this.windows.splice(window.idealIndex, 0, window)
		else this.windows.push(window)
		this.tile()
	}
	removeWindow(window: Window): TiledWindowRef | undefined {
		const windowRefs = this.windows.filter(w => w.ref === window)
		if (windowRefs.length === 0) return undefined
		const windowRef = windowRefs[0]
		this.windows = this.windows.filter(w => w.ref !== window)
		console.log(`Subtracting off current index`)
		if (this.currentIndex === this.windows.length) this.currentIndex -= 1
		console.log(`New current index ${this.currentIndex}`)
		this.tile()
		return windowRef
	}
	tile(): void {
		this.windows.forEach(window => {
			if (window.floating) return
			window.ref.frameGeometry = this.workspaceGeometry
			window.ref.noBorder = true
		})
		workspace.raiseWindow(this.windows[this.currentIndex].ref)
		workspace.activeWindow = this.windows[this.currentIndex].ref
	}
	focusLeft(): void {
		this.currentIndex -= 1
		if (this.currentIndex < 0) this.currentIndex = this.windows.length - 1
		this.tile()
	}
	focusRight(): void {
		this.currentIndex += 1
		this.currentIndex %= this.windows.length
		this.tile
	}
	focusUp(): void {
		this.focusLeft()
	}
	focusDown(): void {
		this.focusRight()
	}
	toggleFloat(): void {
		const newState = !this.windows[this.currentIndex].floating
		this.windows[this.currentIndex].floating = newState
		if (!newState) {
			this.tile()
			return
		}
		const windowRef = this.windows[this.currentIndex].ref
		const minSize: QSize = {
			width: Math.max(windowRef.minSize.width, 600),
			height: Math.max(windowRef.minSize.height, 400)
		}
		const topLeft: QPoint = {
			x: (
				this.workspaceGeometry.x +
				this.workspaceGeometry.width / 2 -
				minSize.width / 2),
			y: (
				this.workspaceGeometry.y +
				this.workspaceGeometry.height / 2 -
				minSize.width / 2
			)
		}
		windowRef.noBorder = false
		windowRef.frameGeometry = {
			...topLeft,
			...minSize
		}
	}
	moveUp(): void {
		const fg = this.windows[this.currentIndex].ref.frameGeometry
		this.windows[this.currentIndex].ref.frameGeometry = {
			...fg,
			y: fg.y - this.splitMoveAmount
		}
	}
	moveDown(): void {
		const fg = this.windows[this.currentIndex].ref.frameGeometry
		this.windows[this.currentIndex].ref.frameGeometry = {
			...fg,
			y: fg.y + this.splitMoveAmount
		}
	}
	moveLeft(): void {
		const fg = this.windows[this.currentIndex].ref.frameGeometry
		this.windows[this.currentIndex].ref.frameGeometry = {
			...fg,
			x: fg.x - this.splitMoveAmount
		}
	}
	moveRight(): void {
		const fg = this.windows[this.currentIndex].ref.frameGeometry
		this.windows[this.currentIndex].ref.frameGeometry = {
			...fg,
			x: fg.x + this.splitMoveAmount
		}
	}
	onFocusWindow(window: Window): void {
		this.currentIndex = this.windows.findIndex(w => window === w.ref)
		this.tile()
	}
}
