import QRect from '../node_modules/kwin-api/src/qt/qrect'
import Window from '../node_modules/kwin-api/src/window'
import Workspace from '../node_modules/kwin-api/src/workspace'
import { Direction, DirectionClockwise, DirectionCounterClockwise, DirectionIsVertical, DirectionMutator, DirectionOpposite, Tiler, TilerContextInterface } from './tilerTypes'

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
	focusIndexers: Record<Direction, Record<number, number>>
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
			[Direction.up]: {},
			[Direction.down]: {},
			[Direction.left]: {},
			[Direction.right]: {}
		}
		// TODO Fix how this is handled
		this.gapAmount = 2
	}
	addGapToRect(rect: QRect, gapAmount: number): QRect {
		const { x, y, width, height } = rect
		return {
			x: x + gapAmount,
			y: y + gapAmount,
			width: width - (gapAmount * 2),
			height: height - (gapAmount * 2)
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
			if (i == this.ctx.tiledWindows.length - 1) {
				w.ref.frameGeometry = this.addGapToRect(remainingSpace, this.gapAmount)
				return
			}
			const [windowSpace, temp] = this.splitSpace(
				remainingSpace, this.splits[i], direction
			)
			w.ref.frameGeometry = this.addGapToRect(windowSpace, this.gapAmount)
			remainingSpace = temp
			direction = this.dirMutator[direction]
		})
		this.ctx.postTile()
	}
	findWindowTo(d: Direction): number {
		const fi = this.ctx.focusedIndex
		const isLastIndex = this.ctx.isLastIndex()
		const currDir = this.findCurrentDirection(fi)
		console.log("Current dir: ", Direction[currDir])
		console.log("Passed dir: ", Direction[d])
		if (!isLastIndex && currDir == d) {
			return fi + 1
		}
		let dir = currDir
		let wantDir = DirectionOpposite[d]
		console.log("Want dir: ", Direction[wantDir])
		for (let i = fi - 1; i >= 0; i--) {
			dir = DirectionCounterClockwise[dir]
			console.log("Dir: ", Direction[dir])
			if (dir == wantDir) return i
		}
		return fi
	}
	getFocusIndex(d: Direction): number {
		const fi = this.ctx.focusedIndex
		const i = this.focusIndexers[d][this.ctx.focusedIndex]
		console.log("Focused indexers return:", i)
		if (i != undefined && i != fi) {
			return i
		}
		return this.findWindowTo(d)
	}
	onFocus(d: Direction): void {
		const index = this.getFocusIndex(d)
		console.log("Returned index: ", index)
		const od = DirectionOpposite[d]
		this.focusIndexers[od][index] = this.ctx.focusedIndex
		this.ctx.focusedIndex = index
		this.tile()
	}
	focusUp(): void {
		this.onFocus(Direction.up)
	}
	focusDown(): void {
		this.onFocus(Direction.down)
	}
	focusLeft(): void {
		this.onFocus(Direction.left)
	}
	focusRight(): void {
		this.onFocus(Direction.right)
	}
	onMove(d: Direction): void {
		const newIndex = this.getFocusIndex(d)
		const od = DirectionOpposite[d]
		this.focusIndexers[od][newIndex] = this.ctx.focusedIndex
		const temp = this.ctx.tiledWindows[newIndex]
		this.ctx.tiledWindows[newIndex] = this.ctx.tiledWindows[this.ctx.focusedIndex]
		this.ctx.tiledWindows[this.ctx.focusedIndex] = temp
		this.ctx.focusedIndex = newIndex
		this.tile()
	}
	moveUp(): void {
		this.onMove(Direction.up)
	}
	moveDown(): void {
		this.onMove(Direction.down)
	}
	moveLeft(): void {
		this.onMove(Direction.left)
	}
	moveRight(): void {
		this.onMove(Direction.right)
	}
	onFocusWindow(window: Window): void {
		this.ctx.focusedIndex = this.ctx.tiledWindows.findIndex(w => window === w.ref)
		this.tile()
	}
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
			this.splits[index] -= splitMoveAmount
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
