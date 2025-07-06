import { findDown, findLeft, findRight, findUp } from './generalTilerFunctions'
import QRect from '../node_modules/kwin-api/src/qt/qrect'
import Window from '../node_modules/kwin-api/src/window'
import Workspace from '../node_modules/kwin-api/src/workspace'
import { BaseTiler, TiledWindowRef, Tiler } from './tilerTypes'

declare const workspace: Workspace

export default class Spiral extends BaseTiler implements Tiler {
	currentIndex: number
	windows: TiledWindowRef[]
	workspaceGeometry: QRect
	splits: number[]
	splitMoveAmount: number
	gapAmount: number
	focusIndexers: {
		up: (number | undefined)[]
		down: (number | undefined)[]
		left: (number | undefined)[]
		right: (number | undefined)[]
	}
	constructor(windows: Window[], workspaceGeometry: QRect) {
		super(windows, workspaceGeometry)
		this.currentIndex = 0
		this.windows = windows.map((window, index) => ({
			ref: window,
			floating: false,
			idealIndex: index
		}))
		this.workspaceGeometry = workspaceGeometry
		console.log("Windows", this.windows)
		console.log("Window length", this.windows.length)
		this.splits = new Array(this.windows.length).fill(0.5)
		console.log("Splits:", this.splits)
		this.splitMoveAmount = 0.05
		this.focusIndexers = {
			up: new Array(undefined, windows.length),
			down: new Array(undefined, windows.length),
			left: new Array(undefined, windows.length),
			right: new Array(undefined, windows.length)
		}
		// TODO Fix how this is handled
		this.gapAmount = 3
	}
	addGapToRect(rect: QRect, gapAmount: number): QRect {
		const { x, y, width, height } = rect
		return {
			x: x + gapAmount / 2,
			y: y + gapAmount / 2,
			width: width - gapAmount,
			height: height - gapAmount
		}
	}
	tile(): void {
		if (this.windows.length === 0) return
		workspace.raiseWindow(this.windows[this.currentIndex].ref)
		workspace.activeWindow = this.windows[this.currentIndex].ref
		const windows = this.windows.filter(w => !w.floating)
		let remainingSpace = this.addGapToRect(this.workspaceGeometry, this.gapAmount)
		let reversed = true
		for (let i = 0; i < windows.length - 1; i++) {
			let windowSpace = remainingSpace
			if (i % 2 === 0) { // Split vertically
				remainingSpace = {
					...remainingSpace,
					width: remainingSpace.width * this.splits[i]
				}
				windowSpace = {
					...remainingSpace,
					x: remainingSpace.x + remainingSpace.width,
					width: windowSpace.width - remainingSpace.width
				}
			} else { // Split horizontally
				remainingSpace = {
					...remainingSpace,
					height: remainingSpace.height * this.splits[i]
				}
				windowSpace = {
					...remainingSpace,
					y: remainingSpace.y + remainingSpace.height,
					height: windowSpace.height - remainingSpace.height
				}
			}
			if (reversed) {
				const temp = windowSpace
				windowSpace = remainingSpace
				remainingSpace = temp
			}
			if (i % 2 === 1) reversed = !reversed
			this.windows[i].ref.frameGeometry = this.addGapToRect(
				windowSpace,
				this.gapAmount
			)
		}
		windows[windows.length - 1].ref.frameGeometry = this.addGapToRect(
			remainingSpace,
			this.gapAmount
		)
	}
	focusUp(): void {
		const newIndex = findUp(this.windows, this.currentIndex, this.focusIndexers.up[this.currentIndex])
		if (newIndex == this.currentIndex) return
		this.focusIndexers.down[newIndex] = this.currentIndex
		this.currentIndex = newIndex
		this.tile()
	}
	focusDown(): void {
		const newIndex = findDown(this.windows, this.currentIndex, this.focusIndexers.down[this.currentIndex])
		if (newIndex == this.currentIndex) return
		this.focusIndexers.up[newIndex] = this.currentIndex
		this.currentIndex = newIndex
		this.tile()
	}
	focusLeft(): void {
		const newIndex = findLeft(this.windows, this.currentIndex, this.focusIndexers.left[this.currentIndex])
		if (newIndex == this.currentIndex) return
		this.focusIndexers.right[newIndex] = this.currentIndex
		this.currentIndex = newIndex
		this.tile()
	}
	focusRight(): void {
		const newIndex = findRight(this.windows, this.currentIndex, this.focusIndexers.right[this.currentIndex])
		if (newIndex == this.currentIndex) return
		this.focusIndexers.left[newIndex] = this.currentIndex
		this.currentIndex = newIndex
		this.tile()
	}
	toggleFloat(): void {
		this.windows[this.currentIndex].floating = !this.windows[this.currentIndex].floating
		this.tile()
	}
	moveUp(): void {
		const newIndex = findUp(this.windows, this.currentIndex, this.focusIndexers.up[this.currentIndex])
		this.focusIndexers.down[newIndex] = this.currentIndex
		const temp = this.windows[newIndex]
		this.windows[newIndex] = this.windows[this.currentIndex]
		this.windows[this.currentIndex] = temp
		this.currentIndex = newIndex
		this.tile()
	}
	moveDown(): void {
		const newIndex = findDown(this.windows, this.currentIndex, this.focusIndexers.down[this.currentIndex])
		this.focusIndexers.up[newIndex] = this.currentIndex
		const temp = this.windows[newIndex]
		this.windows[newIndex] = this.windows[this.currentIndex]
		this.windows[this.currentIndex] = temp
		this.currentIndex = newIndex
		this.tile()
	}
	moveLeft(): void {
		const newIndex = findLeft(this.windows, this.currentIndex, this.focusIndexers.left[this.currentIndex])
		this.focusIndexers.right[newIndex] = this.currentIndex
		const temp = this.windows[newIndex]
		this.windows[newIndex] = this.windows[this.currentIndex]
		this.windows[this.currentIndex] = temp
		this.currentIndex = newIndex
		this.tile()
	}
	moveRight(): void {
		const newIndex = findRight(this.windows, this.currentIndex, this.focusIndexers.right[this.currentIndex])
		this.focusIndexers.left[newIndex] = this.currentIndex
		const temp = this.windows[newIndex]
		this.windows[newIndex] = this.windows[this.currentIndex]
		this.windows[this.currentIndex] = temp
		this.currentIndex = newIndex
		this.tile()
	}
	onFocusWindow(window: Window): void {
		this.currentIndex = this.windows.findIndex(w => window === w.ref)
		this.tile()
	}
	// TODO actually impliment
	splitMoveUp(): void {
		console.log("Split move up called")
		this.splits[this.currentIndex] += this.splitMoveAmount
		this.tile()
	}
	splitMoveDown(): void {
		console.log("Split move down called")
		this.splits[this.currentIndex] -= this.splitMoveAmount
		this.tile()
	}
	splitMoveLeft(): void {
		console.log("Split move left called")
	}
	splitMoveRight(): void {
		console.log("Split move right called")
	}
}
