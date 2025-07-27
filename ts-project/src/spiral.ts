import { findDown, findLeft, findRight, findUp } from './generalTilerFunctions'
import QRect from '../node_modules/kwin-api/src/qt/qrect'
import Window from '../node_modules/kwin-api/src/window'
import Workspace from '../node_modules/kwin-api/src/workspace'
import { Direction, DirectionClockwise, DirectionIsVertical, DirectionMutator, DirectionOpposite, Tiler, TilerContextInterface } from './tilerTypes'

declare const workspace: Workspace

enum Time {
	Millisecond = 1,
	Second = 1000
}

export default class Spiral implements Tiler {
	expansionKeepTime: number
	expandingDir: Direction
	lastExpansionRequest: number
	splitMoveAmount: number
	startingDirection: Direction
	dirMutator: DirectionMutator
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
	constructor(
		ctx: TilerContextInterface,
	) {
		this.expansionKeepTime = 1 * Time.Second
		this.expandingDir = 0 // Does not really matter what we set this to
		this.lastExpansionRequest = Date.now()
		this.splitMoveAmount = 0.05
		this.startingDirection = Direction.right
		this.dirMutator = DirectionClockwise
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
		this.gapAmount = 6
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
			case Direction.down:
			case Direction.right:
				return true
			default:
				return false
		}
	}
	splitSpace(space: QRect, ratio: number, dir: Direction): [QRect, QRect] {
		// We should have a value between 0 and 1 for ratio
		if (ratio < 0 || ratio > 1) throw new Error(`Bad split ratio input: ${ratio}`)
		const shouldR = this.shouldReverse(dir)
		if (!shouldR) ratio = 1 - ratio

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

		return shouldR ? [firstRect, secondRect] : [secondRect, firstRect]
	}
	tile(): void {
		if (this.ctx.tiledWindows.length === 0) return
		// Check that we have all the splits we need
		this.fillNeededSplits()
		// Adds half the border gap we see around the edges
		// The other half comes from when we addGap on the window itself
		let remainingSpace = this.addGapToRect(this.ctx.workspaceGeometry, this.gapAmount)
		let direction = this.startingDirection
		this.ctx.tiledWindows.forEach((w, i) => {
			// Dont run this for our last window
			if (i == this.ctx.tiledWindows.length - 1) return
			const [windowSpace, temp] = this.splitSpace(
				remainingSpace, this.splits[i], direction
			)
			w.ref.frameGeometry = windowSpace
			remainingSpace = temp
			direction = this.dirMutator[direction]
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
	// When we want to expand, that actually means we want to contract the opposite direction
	// When we want to contract, that actually means we want to expand the opposite direction
	// We have a special case when we are the last item in the list where we will bubble up in our own direction
	// TODO actually impliment
	findCurrentDirection(index: number): Direction {
		// Only 4 directions total, so we can eliminate those
		const modIndex = index % 4
		let direction = this.startingDirection
		for (let i = 0; i < modIndex; i++) {
			direction = this.dirMutator[direction]
		}
		return direction
	}
	ifResizeExpandingDefer(dir: Direction): boolean {
		const currentTime = Date.now()
		const timeDiff = currentTime - this.lastExpansionRequest
		if (timeDiff < this.expansionKeepTime) {
			switch (dir) {
				case this.expandingDir:
					return true
				case DirectionOpposite[this.expandingDir]:
					return false
			}
		}
		this.expandingDir = dir
		return true
	}
	isResizeExpanding(dir: Direction): boolean {
		const retVal = this.ifResizeExpandingDefer(dir)
		this.lastExpansionRequest = Date.now()
		return retVal
	}
	resizeWindowRecurse(index: number, direction: Direction, splitMoveAmount: number): void {
		const compDir = this.findCurrentDirection(index)
		if (direction === compDir) {
				console.log(`Direction: ${Direction[direction]} Index: ${index}`)
			this.splits[index] += splitMoveAmount
		} else if (index != 0) {
			this.resizeWindowRecurse(index - 1, direction, splitMoveAmount)
		}
	}
	resizeWindowKickoff(index: number, direction: Direction, isExpanding: boolean): void {
		const compDir = this.findCurrentDirection(index)
		const movePolarity = isExpanding ? -1 : 1
		console.log(`Move polarity: ${movePolarity}`)
		const splitMoveAmount = this.splitMoveAmount * movePolarity
		if (!this.ctx.isLastIndex() && direction === compDir) {
			this.splits[index] += splitMoveAmount
			return
		}
		this.resizeWindowRecurse(index - 1, DirectionOpposite[direction], splitMoveAmount)
	}
	resizeWindow(dir: Direction): void {
		if (this.ctx.focusedFloating) return
		if (this.ctx.tiledWindows.length === 0) return
		const isExpanding = this.isResizeExpanding(dir)
		this.resizeWindowKickoff(
			this.ctx.focusedIndex,
			this.expandingDir,
			isExpanding
		)
	}
	windowResizeUp(): void {
		console.log("Split move up called")
		this.resizeWindow(Direction.up)
		this.tile()
	}
	windowResizeDown(): void {
		console.log("Split move down called")
		this.resizeWindow(Direction.down)
		this.tile()
	}
	windowResizeLeft(): void {
		console.log("Split move left called")
		this.resizeWindow(Direction.left)
		this.tile()
	}
	windowResizeRight(): void {
		console.log("Split move right called")
		this.resizeWindow(Direction.right)
		this.tile()
	}
}
