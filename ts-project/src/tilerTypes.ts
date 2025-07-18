import Workspace from '../node_modules/kwin-api/src/baseWorkspace'
import QPoint from '../node_modules/kwin-api/src/qt/qpoint'
import QRect from '../node_modules/kwin-api/src/qt/qrect'
import QSize from '../node_modules/kwin-api/src/qt/qsize'
import Window from '../node_modules/kwin-api/src/window'

declare const workspace: Workspace

export enum Direction {
	up = 0,
	down = 1,
	left = 2,
	right = 3
}

export type DirectionMutator = (input: Direction) => Direction

export const DirectionOpposite = {
	[Direction.up]: Direction.down,
	[Direction.down]: Direction.up,
	[Direction.left]: Direction.right,
	[Direction.right]: Direction.left
}

export const DirectionClockwise = {
	[Direction.up]: Direction.right,
	[Direction.right]: Direction.down,
	[Direction.down]: Direction.left,
	[Direction.left]: Direction.up
}

export const DirectionCounterClockwise = {
	[Direction.up]: Direction.left,
	[Direction.left]: Direction.down,
	[Direction.down]: Direction.right,
	[Direction.right]: Direction.up
}

export const DirectionIsVertical = {
		[Direction.up]: true,
		[Direction.down]: true,
		[Direction.left]: false,
		[Direction.right]: false,
}

export type TiledWindowRef = {
	ref: Window,
	idealIndex: number,
}

// Functions we should implement to be a tiler
export interface Tiler {
	ctx: TilerContextInterface
	// Focus functions
	focusLeft(): void
	focusRight(): void
	focusUp(): void
	focusDown(): void
	// Move functions
	moveUp(): void
	moveDown(): void
	moveLeft(): void
	moveRight(): void
	windowResizeLeft(): void
	// Help us resize windows
	windowResizeRight(): void
	windowResizeUp(): void
	windowResizeDown(): void
}

// Data and functions that are shared among all tilers
export interface TilerContextInterface {
	// This acts as a singleton for context among all tilers on a virtual desktop
	// Therefore we need a tiler to be able to pass our context to
	// Context data we track
	tiledWindows: TiledWindowRef[]
	floatingWindows: TiledWindowRef[]
	workspaceGeometry: QRect
	windowResizeMoveAmount: number
	focusedIndex: number
	focusedFloating: boolean
	// Utilities for interacting with the window lists
	getCurrentWindow(): TiledWindowRef | undefined
	// Functions to handle user action utilities
	// Such as adding windows to lists
	addWindow(window: Window, tiled?: boolean): void
	addWindowRef(window: TiledWindowRef, tiled?: boolean): void
	removeWindow(window: Window): TiledWindowRef | undefined
	windowIsTileable(window: Window): boolean
	// Float functions
	toggleFloat(): void
	// Float utility functions
	floatingWindowMoveAmount: number
	moveFloatingWindowUp(): void
	moveFloatingWindowDown(): void
	moveFloatingWindowLeft(): void
	moveFloatingWindowRight(): void
	postTile(): void
	// Functions where the user goes outisde the tilers usual controls
	onFocusWindow(window: Window): void
}


export class TilerContext implements TilerContextInterface {
	// Variables the class impliments
	tiledWindows: TiledWindowRef[]
	floatingWindows: TiledWindowRef[]
	workspaceGeometry: QRect
	windowResizeMoveAmount: number
	focusedIndex: number
	focusedFloating: boolean
	floatingWindowMoveAmount: number
	focusIndexBackup: number
	windowIsTileable(window: Window): boolean {
		// Almost anything but a normal window is not really for us to tile
		if (window.dock ||
			window.toolbar ||
			window.menu ||
			window.desktopWindow ||
			window.dialog ||
			window.splash ||
			window.utility ||
			window.dropdownMenu ||
			window.popupMenu ||
			window.popupWindow ||
			window.popupMenu ||
			window.notification ||
			window.criticalNotification ||
			window.dndIcon ||
			window.modal ||
			window.minimized ||
			window.fullScreen
		) return false
		if (!window.normalWindow) return false
		return true
	}
	// Builds a new tiler given windows and workspace geom
	constructor(windows: Window[], workspaceGeometry: QRect, floatingWindowMoveAmount = 10) {
		this.floatingWindowMoveAmount = floatingWindowMoveAmount
		this.focusedIndex = 0
		this.focusedFloating = false
		this.focusIndexBackup = 0
		const tiledWindows = windows.filter(w => this.windowIsTileable(w))
		const floatingWindows = windows.filter(w => !this.windowIsTileable(w))
		// Set our focus to the index of a window, if any exist upon initalization
		tiledWindows.forEach((w, i) => {
			if (w == workspace.activeWindow) {
				// Focus floating = false is allready set 
				this.focusedIndex = i
			}
		})
		// Register if we are focused on a floating window
		floatingWindows.forEach((w, i) => {
			if (w == workspace.activeWindow) {
				this.focusedFloating = true
				this.focusedIndex = i
			}
		})
		this.tiledWindows = tiledWindows.map((window, index) => ({
			ref: window,
			idealIndex: index
		}))
		this.floatingWindows = floatingWindows.map((window, index) => ({
			ref: window,
			idealIndex: index
		}))
		this.workspaceGeometry = workspaceGeometry
		this.windowResizeMoveAmount = 10
	}
	postTile(): void {
		this.floatingWindows.forEach(window => {
			workspace.raiseWindow(window.ref)
		})
	}
	getCurrentWindow(): TiledWindowRef | undefined {
		const windowList = (
			this.focusedFloating ? this.floatingWindows : this.tiledWindows
		)
		if (windowList.length == 0) return undefined
		return windowList[this.focusedIndex]
	}
	addWindow(window: Window): void {
		const tiled = this.windowIsTileable(window)
		if (tiled || tiled == undefined) {
			this.tiledWindows.push({
				ref: window,
				idealIndex: this.tiledWindows.length
			})
			console.log("Calculated index:", this.tiledWindows.length - 1)
			this.focusedIndex = this.tiledWindows.length - 1
			this.focusedFloating = false
		} else {
			this.floatingWindows.push({
				ref: window,
				idealIndex: this.tiledWindows.length,
			})
			this.focusedIndex = this.floatingWindows.length - 1
			this.focusedFloating = true
		}
	}
	addWindowRef(window: TiledWindowRef): void {
		if (window.idealIndex < this.tiledWindows.length) this.tiledWindows.splice(window.idealIndex, 0, window)
		else this.tiledWindows.push(window)
	}
	removeWindow(window: Window): TiledWindowRef | undefined {
		console.log("Context detected window closed")
		const index = this.tiledWindows.findIndex(w => w.ref === window)
		if (index === -1) return undefined
		const windowRef = this.tiledWindows[index]
		this.tiledWindows = this.tiledWindows.filter(w => w.ref !== window)
		this.focusedIndex = this.focusIndexBackup
		if (this.focusedIndex >= this.tiledWindows.length) this.focusedIndex -= 1
		return windowRef
	}
	// Float functions
	resizeWindowForFloat(windowRef: Window): void {
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
	toggleFloat(): void {
		console.log("Toggle float triggered, currently focused on floating: ", this.focusedFloating)
		const pullingFrom = this.focusedFloating ? this.floatingWindows : this.tiledWindows;
		const pushingTo = this.focusedFloating ? this.tiledWindows : this.floatingWindows;

		const windowRef = pullingFrom[this.focusedIndex];

		// Remove from the original array
		pullingFrom.splice(this.focusedIndex, 1);

		// Insert into the target array at the desired index
		const insertIndex = Math.min(windowRef.idealIndex, pushingTo.length)
		pushingTo.splice(insertIndex, 0, windowRef);

		// Update the focusedFloating state
		this.focusedFloating = !this.focusedFloating;
		this.focusedIndex = insertIndex
		console.log("Now focused floating is", this.focusedFloating)
		console.log("Now focued index is", this.focusedIndex)
		if (this.focusedFloating) this.resizeWindowForFloat(windowRef.ref)
	}

	// Float utility functions
	moveFloatingWindowUp(): void {
		if (!this.focusedFloating) {
			throw new Error("Calling floating window operation without focus")
		}
		const geometry = this.floatingWindows[this.focusedIndex].ref.frameGeometry
		const newYValue = Math.min(0, geometry.y - this.floatingWindowMoveAmount)
		this.floatingWindows[this.focusedIndex].ref.frameGeometry = {
			...geometry,
			y: newYValue
		}
	}
	moveFloatingWindowDown(): void {
		if (!this.focusedFloating) {
			throw new Error("Calling floating window operation without focus")
		}
		const geometry = this.floatingWindows[this.focusedIndex].ref.frameGeometry
		const newYValue = Math.max(
			this.workspaceGeometry.height - geometry.height,
			geometry.y + this.floatingWindowMoveAmount
		)
		this.floatingWindows[this.focusedIndex].ref.frameGeometry = {
			...geometry,
			y: newYValue
		}
	}
	moveFloatingWindowLeft(): void {
		if (!this.focusedFloating) {
			throw new Error("Calling floating window operation without focus")
		}
		const geometry = this.floatingWindows[this.focusedIndex].ref.frameGeometry
		const newXValue = Math.min(0, geometry.x - this.floatingWindowMoveAmount)
		this.floatingWindows[this.focusedIndex].ref.frameGeometry = {
			...geometry,
			x: newXValue
		}
	}
	moveFloatingWindowRight(): void {
		if (!this.focusedFloating) {
			throw new Error("Calling floating window operation without focus")
		}
		const geometry = this.floatingWindows[this.focusedIndex].ref.frameGeometry
		const newXValue = Math.max(
			this.workspaceGeometry.width - geometry.width,
			geometry.x + this.floatingWindowMoveAmount
		)
		this.floatingWindows[this.focusedIndex].ref.frameGeometry = {
			...geometry,
			x: newXValue
		}
	}
	findFocusIndex(): void {
		const tiledIndex = this.tiledWindows.findIndex(
			w => w.ref == workspace.activeWindow
		)
		if (tiledIndex > -1) {
			this.focusedFloating = false
			this.focusedIndex = tiledIndex
			return
		}
		const floatingIndex = this.floatingWindows.findIndex(
			w => w.ref == workspace.activeWindow
		)
		if (floatingIndex > -1) {
			this.focusedFloating = true
			this.focusedIndex = floatingIndex
			return
		}
		throw new Error("No window found when calling findFocusIndex")
	}
	onFocusWindow(window: Window): void {
		this.focusIndexBackup = this.focusedIndex
		this.findFocusIndex()
	}
}
