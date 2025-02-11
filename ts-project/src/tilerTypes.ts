import QRect from '../node_modules/kwin-api/src/qt/qrect'
import Window from '../node_modules/kwin-api/src/window'

export type TiledWindowRef = {
	ref: Window,
	idealIndex: number,
	floating: boolean
}

export interface Tiler {
	windows: TiledWindowRef[]
	workspaceGeometry: QRect
	// Functions to handle refreshing of tiling
	tile(windows: Window[]): void
	// Focus functions
	focusLeft(): void
	//		focusRight():void
	//		focusUp():void
	//		focusDown():void
	// Move functions
	//		moveUp(): void
	//		moveDown():void
	//		moveLeft():void
	//		moveRight():void
	// TODO: Move Split
}
