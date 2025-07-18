import { findDown, findLeft, findRight, findUp } from './generalTilerFunctions'
import QRect from '../node_modules/kwin-api/src/qt/qrect'
import Window from '../node_modules/kwin-api/src/window'
import Workspace from '../node_modules/kwin-api/src/workspace'
import { Direction, DirectionClockwise, DirectionIsVertical, Tiler, TilerContextInterface } from './tilerTypes'

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
	// TODO, eventually remove this
	// It basically just ensures we have all the splits we need for tiling not to break
	fillNeededSplits() {
		while (this.splits.length < this.ctx.tiledWindows.length) {
			this.splits = [...this.splits, 0.5]
		}
	}
	shouldReverse(dir: Direction): boolean {
		switch (dir) {
			case Direction.up:
			case Direction.left:
				return true
			default:
				return false
		}
	}
	splitSpace(space: QRect, ratio: number, dir: Direction): [QRect, QRect] {
		// We should have a value between 0 and 1 for ratio
		if (ratio < 0 || ratio > 1) throw new Error(`Bad split ratio input: ${ratio}`)

		const isV = DirectionIsVertical[dir]
		const lenKey = isV ? "height" : "width"
		const posKey = isV ? "y" : "x"

		const firstSize = space[lenKey] * ratio
		const secondSize = space[lenKey] - firstSize

		const firstRect: QRect = {
			...space,
			[lenKey]: firstSize
		}
		const secondRect: QRect = {
			...space,
			[lenKey]: secondSize,
			[posKey]: space[posKey] + firstSize
		}

		const shouldR = this.shouldReverse(dir)
		return shouldR ? [firstRect, secondRect] : [secondRect, firstRect]
	}
	tile(): void {
		console.log("Spiral tile call initated")
		if (this.ctx.tiledWindows.length === 0) return
		// Check that we have all the splits we need
		this.fillNeededSplits()
		// Ensure kwin can see and is focused on the right window
		workspace.raiseWindow(this.ctx.tiledWindows[this.ctx.focusedIndex].ref)
		workspace.activeWindow = this.ctx.tiledWindows[this.ctx.focusedIndex].ref
		// Adds half the border gap we see around the edges
		// The other half comes from when we addGap on the window itself
		let remainingSpace = this.addGapToRect(this.ctx.workspaceGeometry, this.gapAmount)
		let direction = Direction.left
		const dirMutator = DirectionClockwise
		this.ctx.tiledWindows.forEach((w, i) => {
			// Dont run this for our last window
			if (i == this.ctx.tiledWindows.length - 1) return
			const [windowSpace, temp] = this.splitSpace(
				remainingSpace, this.splits[i], direction
			)
			w.ref.frameGeometry = windowSpace 
			remainingSpace = temp
			direction = dirMutator[direction]
		})
		// Tile our last window
		this.ctx.tiledWindows[
			this.ctx.tiledWindows.length - 1
		].ref.frameGeometry = remainingSpace
		// Push floating windows to to the top of the screen
		// And any postTile cleanup added in the future
		this.ctx.postTile()
	}
	focusUp(): void {
		const newIndex = findUp(
			this.ctx.tiledWindows,
			this.ctx.focusedIndex,
			this.focusIndexers.up[this.ctx.focusedIndex]
		)
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
