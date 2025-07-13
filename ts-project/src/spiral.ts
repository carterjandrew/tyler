import { findDown, findLeft, findRight, findUp } from './generalTilerFunctions'
import QRect from '../node_modules/kwin-api/src/qt/qrect'
import Window from '../node_modules/kwin-api/src/window'
import Workspace from '../node_modules/kwin-api/src/workspace'
import { BaseTiler, TiledWindowRef, Tiler } from './tilerTypes'

declare const workspace: Workspace

export default class Spiral extends BaseTiler implements Tiler {
	splits: number[]
	windowResizeMoveAmount: number
	gapAmount: number
	focusIndexers: {
		up: (number | undefined)[]
		down: (number | undefined)[]
		left: (number | undefined)[]
		right: (number | undefined)[]
	}
	constructor(windows: Window[], workspaceGeometry: QRect) {
		super(windows, workspaceGeometry)
		this.splits = new Array(windows.length).fill(0.5)
		this.windowResizeMoveAmount= 0.05
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
		if (this.tiledWindows.length === 0) return
		workspace.raiseWindow(this.tiledWindows[this.focusedIndex].ref)
		workspace.activeWindow = this.tiledWindows[this.focusedIndex].ref
		let remainingSpace = this.addGapToRect(this.workspaceGeometry, this.gapAmount)
		let reversed = true
		for (let i = 0; i < this.tiledWindows.length - 1; i++) {
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
				windowSpace = { ...remainingSpace,
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
			this.tiledWindows[i].ref.frameGeometry = this.addGapToRect(
				windowSpace,
				this.gapAmount
			)
		}
		this.tiledWindows[this.tiledWindows.length - 1].ref.frameGeometry = this.addGapToRect(
			remainingSpace,
			this.gapAmount
		)
	}
	focusUp(): void {
		const newIndex = findUp(this.tiledWindows, this.focusedIndex, this.focusIndexers.up[this.focusedIndex])
		if (newIndex == this.focusedIndex) return
		this.focusIndexers.down[newIndex] = this.focusedIndex
		this.focusedIndex = newIndex
		this.tile()
	}
	focusDown(): void {
		const newIndex = findDown(this.tiledWindows, this.focusedIndex, this.focusIndexers.down[this.focusedIndex])
		if (newIndex == this.focusedIndex) return
		this.focusIndexers.up[newIndex] = this.focusedIndex
		this.focusedIndex = newIndex
		this.tile()
	}
	focusLeft(): void {
		const newIndex = findLeft(this.tiledWindows, this.focusedIndex, this.focusIndexers.left[this.focusedIndex])
		if (newIndex == this.focusedIndex) return
		this.focusIndexers.right[newIndex] = this.focusedIndex
		this.focusedIndex = newIndex
		this.tile()
	}
	focusRight(): void {
		const newIndex = findRight(this.tiledWindows, this.focusedIndex, this.focusIndexers.right[this.focusedIndex])
		if (newIndex == this.focusedIndex) return
		this.focusIndexers.left[newIndex] = this.focusedIndex
		this.focusedIndex = newIndex
		this.tile()
	}
	moveUp(): void {
		const newIndex = findUp(this.tiledWindows, this.focusedIndex, this.focusIndexers.up[this.focusedIndex])
		this.focusIndexers.down[newIndex] = this.focusedIndex
		const temp = this.tiledWindows[newIndex]
		this.tiledWindows[newIndex] = this.tiledWindows[this.focusedIndex]
		this.tiledWindows[this.focusedIndex] = temp
		this.focusedIndex = newIndex
		this.tile()
	}
	moveDown(): void {
		const newIndex = findDown(this.tiledWindows, this.focusedIndex, this.focusIndexers.down[this.focusedIndex])
		this.focusIndexers.up[newIndex] = this.focusedIndex
		const temp = this.tiledWindows[newIndex]
		this.tiledWindows[newIndex] = this.tiledWindows[this.focusedIndex]
		this.tiledWindows[this.focusedIndex] = temp
		this.focusedIndex = newIndex
		this.tile()
	}
	moveLeft(): void {
		const newIndex = findLeft(this.tiledWindows, this.focusedIndex, this.focusIndexers.left[this.focusedIndex])
		this.focusIndexers.right[newIndex] = this.focusedIndex
		const temp = this.tiledWindows[newIndex]
		this.tiledWindows[newIndex] = this.tiledWindows[this.focusedIndex]
		this.tiledWindows[this.focusedIndex] = temp
		this.focusedIndex = newIndex
		this.tile()
	}
	moveRight(): void {
		const newIndex = findRight(this.tiledWindows, this.focusedIndex, this.focusIndexers.right[this.focusedIndex])
		this.focusIndexers.left[newIndex] = this.focusedIndex
		const temp = this.tiledWindows[newIndex]
		this.tiledWindows[newIndex] = this.tiledWindows[this.focusedIndex]
		this.tiledWindows[this.focusedIndex] = temp
		this.focusedIndex = newIndex
		this.tile()
	}
	onFocusWindow(window: Window): void {
		this.focusedIndex = this.tiledWindows.findIndex(w => window === w.ref)
		this.tile()
	}
	// I have determined a rule set for interacting with this, for a spiral layout:
	// There are two important directions our window needs to handle:
	// Primary, where it leaves reminaing space
	// Opposite, opposite direction to this
	// If we detect primary expend in that direction
	// If we do not, look at previous index and see if it's opposite, if opposite we shrink
	// If we fail to find previous index, we flip our direction and try again
	// We will keep a cache of the last index moved, and for half a second if we detect a move in it's directions we will move the split according to that
	// TODO actually impliment
	windowResizeUp(): void {
		console.log("Split move up called")
		this.splits[this.focusedIndex] += this.windowResizeMoveAmount
		this.tile()
	}
	windowResizeDown(): void {
		console.log("Split move down called")
		this.splits[this.focusedIndex] -= this.windowResizeMoveAmount
		this.tile()
	}
	windowResizeLeft(): void {
		console.log("Split move left called")
	}
	windowResizeRight(): void {
		console.log("Split move right called")
	}
}
