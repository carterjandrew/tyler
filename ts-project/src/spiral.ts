import { findDown, findLeft, findRight, findUp } from './generalTilerFunctions'
import QRect from '../node_modules/kwin-api/src/qt/qrect'
import Window from '../node_modules/kwin-api/src/window'
import Workspace from '../node_modules/kwin-api/src/workspace'
import { Tiler, TilerContextInterface } from './tilerTypes'

declare const workspace: Workspace

export default class Spiral implements Tiler {
	splits: number[]
	windowResizeMoveAmount: number
	gapAmount: number
	focusIndexers: {
		up: (number | undefined)[]
		down: (number | undefined)[]
		left: (number | undefined)[]
		right: (number | undefined)[]
	}
	ctx: TilerContextInterface
	constructor(ctx: TilerContextInterface, gapAmount = 4) {
		this.ctx = ctx
		this.splits = new Array(ctx.tiledWindows.length).fill(0.5)
		this.windowResizeMoveAmount = 0.05
		this.focusIndexers = {
			up: new Array(undefined, ctx.tiledWindows.length),
			down: new Array(undefined, ctx.tiledWindows.length),
			left: new Array(undefined, ctx.tiledWindows.length),
			right: new Array(undefined, ctx.tiledWindows.length)
		}
		// TODO Fix how this is handled
		this.gapAmount = gapAmount
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
		console.log("Spiral tile call initated")
		if (this.ctx.tiledWindows.length === 0) return
		// Check that we have all the splits we need
		while (this.splits.length < this.ctx.tiledWindows.length) {
			this.splits = [...this.splits, 0.5]
		}
		workspace.raiseWindow(this.ctx.tiledWindows[this.ctx.focusedIndex].ref)
		workspace.activeWindow = this.ctx.tiledWindows[this.ctx.focusedIndex].ref
		let remainingSpace = this.addGapToRect(this.ctx.workspaceGeometry, this.gapAmount)
		let reversed = true
		for (let i = 0; i < this.ctx.tiledWindows.length - 1; i++) {
			console.log(`Split for tile ${i} is ${this.splits[i]}`)
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
			this.ctx.tiledWindows[i].ref.frameGeometry = this.addGapToRect(
				windowSpace,
				this.gapAmount
			)
			console.log(`Spiral tiler tiled window index ${i} with geometry ${JSON.stringify(windowSpace, null, 2)}`)
			console.log(`Spiral tiler left remaining geometry ${JSON.stringify(remainingSpace, null, 2)}`)
		}
		this.ctx.tiledWindows[this.ctx.tiledWindows.length - 1].ref.frameGeometry = this.addGapToRect(
			remainingSpace,
			this.gapAmount
		)
	}
	focusUp(): void {
		const newIndex = findUp(this.ctx.tiledWindows, this.ctx.focusedIndex, this.focusIndexers.up[this.ctx.focusedIndex])
		if (newIndex == this.ctx.focusedIndex) return
		this.focusIndexers.down[newIndex] = this.ctx.focusedIndex
		this.ctx.focusedIndex = newIndex
		this.tile()
	}
	focusDown(): void {
		const newIndex = findDown(this.ctx.tiledWindows, this.ctx.focusedIndex, this.focusIndexers.down[this.ctx.focusedIndex])
		if (newIndex == this.ctx.focusedIndex) return
		this.focusIndexers.up[newIndex] = this.ctx.focusedIndex
		this.ctx.focusedIndex = newIndex
		this.tile()
	}
	focusLeft(): void {
		const newIndex = findLeft(this.ctx.tiledWindows, this.ctx.focusedIndex, this.focusIndexers.left[this.ctx.focusedIndex])
		if (newIndex == this.ctx.focusedIndex) return
		this.focusIndexers.right[newIndex] = this.ctx.focusedIndex
		this.ctx.focusedIndex = newIndex
		this.tile()
	}
	focusRight(): void {
		const newIndex = findRight(this.ctx.tiledWindows, this.ctx.focusedIndex, this.focusIndexers.right[this.ctx.focusedIndex])
		if (newIndex == this.ctx.focusedIndex) return
		this.focusIndexers.left[newIndex] = this.ctx.focusedIndex
		this.ctx.focusedIndex = newIndex
		this.tile()
	}
	moveUp(): void {
		const newIndex = findUp(this.ctx.tiledWindows, this.ctx.focusedIndex, this.focusIndexers.up[this.ctx.focusedIndex])
		this.focusIndexers.down[newIndex] = this.ctx.focusedIndex
		const temp = this.ctx.tiledWindows[newIndex]
		this.ctx.tiledWindows[newIndex] = this.ctx.tiledWindows[this.ctx.focusedIndex]
		this.ctx.tiledWindows[this.ctx.focusedIndex] = temp
		this.ctx.focusedIndex = newIndex
		this.tile()
	}
	moveDown(): void {
		const newIndex = findDown(this.ctx.tiledWindows, this.ctx.focusedIndex, this.focusIndexers.down[this.ctx.focusedIndex])
		this.focusIndexers.up[newIndex] = this.ctx.focusedIndex
		const temp = this.ctx.tiledWindows[newIndex]
		this.ctx.tiledWindows[newIndex] = this.ctx.tiledWindows[this.ctx.focusedIndex]
		this.ctx.tiledWindows[this.ctx.focusedIndex] = temp
		this.ctx.focusedIndex = newIndex
		this.tile()
	}
	moveLeft(): void {
		const newIndex = findLeft(this.ctx.tiledWindows, this.ctx.focusedIndex, this.focusIndexers.left[this.ctx.focusedIndex])
		this.focusIndexers.right[newIndex] = this.ctx.focusedIndex
		const temp = this.ctx.tiledWindows[newIndex]
		this.ctx.tiledWindows[newIndex] = this.ctx.tiledWindows[this.ctx.focusedIndex]
		this.ctx.tiledWindows[this.ctx.focusedIndex] = temp
		this.ctx.focusedIndex = newIndex
		this.tile()
	}
	moveRight(): void {
		const newIndex = findRight(this.ctx.tiledWindows, this.ctx.focusedIndex, this.focusIndexers.right[this.ctx.focusedIndex])
		this.focusIndexers.left[newIndex] = this.ctx.focusedIndex
		const temp = this.ctx.tiledWindows[newIndex]
		this.ctx.tiledWindows[newIndex] = this.ctx.tiledWindows[this.ctx.focusedIndex]
		this.ctx.tiledWindows[this.ctx.focusedIndex] = temp
		this.ctx.focusedIndex = newIndex
		this.tile()
	}
	onFocusWindow(window: Window): void {
		this.ctx.focusedIndex = this.ctx.tiledWindows.findIndex(w => window === w.ref)
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
		this.splits[this.ctx.focusedIndex] += this.windowResizeMoveAmount
		this.tile()
	}
	windowResizeDown(): void {
		console.log("Split move down called")
		this.splits[this.ctx.focusedIndex] -= this.windowResizeMoveAmount
		this.tile()
	}
	windowResizeLeft(): void {
		console.log("Split move left called")
	}
	windowResizeRight(): void {
		console.log("Split move right called")
	}
}
