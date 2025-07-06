import QRect from '../node_modules/kwin-api/src/qt/qrect'
import Window from '../node_modules/kwin-api/src/window'

export enum Directions {
	up = 0,
	down = 1,
	left = 2,
	right = 3
}

export const DirectionOpposite = {
		[Directions.up]: Directions.down,
		[Directions.down]: Directions.up,
		[Directions.left]: Directions.right,
		[Directions.right]: Directions.left
}

export const DirectionClockwise = {
		[Directions.up]: Directions.right,
		[Directions.right]: Directions.down,
		[Directions.down]: Directions.left,
		[Directions.left]: Directions.up
}

export const DirectionsCounterClockwise = {
		[Directions.up]: Directions.left,
		[Directions.left]: Directions.down,
		[Directions.down]: Directions.right,
		[Directions.right]: Directions.up
}

export type TiledWindowRef = {
	ref: Window,
	idealIndex: number,
	floating: boolean,
}

export interface BaseTilerType {
	windows: TiledWindowRef[]
	workspaceGeometry: QRect
	splits: number[]
	splitMoveAmount: number
	currentIndex: number
	// Constructor
	// Functions to handle refreshing of tiling
	tile(): void
	addWindow(window: Window): void
	addWindowRef(window: TiledWindowRef): void
	removeWindow(window: Window): TiledWindowRef | undefined
}

export interface Tiler extends BaseTilerType {
	// Focus functions
	focusLeft(): void
	focusRight(): void
	focusUp(): void
	focusDown(): void
	// Float functions
	toggleFloat(): void
	// Move functions
	moveUp(): void
	moveDown(): void
	moveLeft(): void
	moveRight(): void
	// TODO: Move Split
	splitMoveLeft(): void
	splitMoveRight(): void
	splitMoveUp(): void
	splitMoveDown(): void
	// Functions where the user goes outisde the tilers usual controls
	onFocusWindow(window: Window): void
}

export class BaseTiler implements BaseTilerType {
	windows: TiledWindowRef[]
	splits: number[]
	workspaceGeometry: QRect
	splitMoveAmount: number
	currentIndex: number
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
		this.currentIndex = this.windows.length - 1
		this.tile()
	}
	addWindowRef(window: TiledWindowRef): void {
		if (window.idealIndex < this.windows.length) this.windows.splice(window.idealIndex, 0, window)
		else this.windows.push(window)
		this.tile()
	}
	removeWindow(window: Window): TiledWindowRef | undefined {
		const index = this.windows.findIndex(w => w.ref === window)
		if (index === -1) return undefined
		const windowRef = this.windows[index]
		this.windows = this.windows.filter(w => w.ref !== window)
		console.log("Starting index:", this.currentIndex)
		if (this.currentIndex != 0) this.currentIndex -= 1
		console.log("Ending index:", this.currentIndex)
		return windowRef
	}
	tile(): void {

	}
}
