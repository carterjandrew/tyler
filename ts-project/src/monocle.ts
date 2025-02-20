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
	addWindow(window: Window) {
		this.windows.splice(this.currentIndex + 1, 0, {
			ref: window,
			idealIndex: this.currentIndex + 1,
			floating: false
		})
		this.currentIndex += 1
		this.tile()
	}
	removeWindow(window: Window) {
		this.windows = this.windows.filter(w => w.ref !== window)
		if (this.currentIndex === this.windows.length) this.currentIndex -= 1
		this.tile()
	}
	tile(): void {
		this.windows.forEach(window => {
			const minSize: QSize = {
				width: Math.max(window.ref.minSize.width, 600),
				height: Math.max(window.ref.minSize.height, 400)
			}
			window.ref.frameGeometry = window.floating ? {
				x: (
					this.workspaceGeometry.x +
					this.workspaceGeometry.width / 2 -
					minSize.width / 2
				),
				y: (
					this.workspaceGeometry.y +
					this.workspaceGeometry.height / 2 -
					minSize.height / 2
				),
				...minSize // Give us width and height
			} : this.workspaceGeometry
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
		this.windows[this.currentIndex].floating = !this.windows[this.currentIndex].floating
		this.tile()
	}
	// These do nothing for us
	// TODO: They could move the floating window though
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
}
