import QPoint from '../node_modules/kwin-api/src/qt/qpoint'
import QRect from '../node_modules/kwin-api/src/qt/qrect'
import QSize from '../node_modules/kwin-api/src/qt/qsize'
import Window from '../node_modules/kwin-api/src/window'

export type TiledWindowRef = {
	ref: Window,
	idealIndex: number,
	floating: boolean,
}

export interface Tiler {
	windows: TiledWindowRef[]
	workspaceGeometry: QRect
	splits: number[]
	splitMoveAmount: number
	// Functions to handle refreshing of tiling
	tile(windows: Window[]): void
	addWindow(window: Window): void
	removeWindow(window: Window): void
	// Focus functions
	focusLeft(): void
	focusRight():void
	focusUp():void
	focusDown():void
	// Float functions
	toggleFloat(): void
	// Move functions
	moveUp(): void
	moveDown():void
	moveLeft():void
	moveRight():void
	// TODO: Move Split
	// splitMoveLeft(): void
	// splitMoveRight(): void
	// splitMoveUp(): void
	// splitMoveDown(): void
	// Functions where the user goes outisde the tilers usual controls
	onFocusWindow(window: Window): void
}
