/**
 * This defines a global list we use to track our windows
 * It helps us define what window it is, where it should be,
 * and what desktop it should be on. 
 * This list helps unify outputs between tilers
 * It also makes transfering items from one tiler to another much easier. 
 */
type TiledWindowRef = {
		id: string,
		desktop: number,
		idealOrder: number,
		actualOrder: number,
		floating: boolean,
}

interface Tiler {
		// TODO: Need a way to either access our global list or store locally
		// Functions to handle refreshing of tiling
		tile(): void
		// Focus functions
		focusLeft():void
		focusRight():void
		focusUp():void
		focusDown():void
		// Move functions
		moveUp(): void
		moveDown():void
		moveLeft():void
		moveRight():void
		// TODO: Move Split
}
