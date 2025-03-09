import { TiledWindowRef } from './tilerTypes'

/**
 * Function takes in the windows and will return the new index we should focus on
 */
export function focusUp(windows: TiledWindowRef[], currentIndex: number): number {
	const { x, y} = windows[currentIndex].ref.frameGeometry
	const indexedWindows = windows.map((window, index) => ({
		window: window,
		index: index
	}))
	// Our goal is to find the window with the largest smaller y value
	// And the same x value
	const filteredWindows = indexedWindows
		.filter(w => w.window.ref.frameGeometry.x === x)
		.filter(w => w.window.ref.frameGeometry.y < y)
	if (filteredWindows.length === 0) return currentIndex
	const sortedWindows = filteredWindows.sort((a, b) => a.window.ref.frameGeometry.y - b.window.ref.frameGeometry.y)
	return sortedWindows[0].index
}
/**
 * Function does the same but for down
 */
export function focusDown(windows: TiledWindowRef[], currentIndex: number): number {
	const { x, y } = windows[currentIndex].ref.frameGeometry
	const indexedWindows = windows.map((window, index) => ({
		window: window,
		index: index
	}))
	// Our goal is to find the window with the largest smaller y value
	// And the same x value
	const filteredWindows = indexedWindows
		.filter(w => w.window.ref.frameGeometry.x === x)
		.filter(w => w.window.ref.frameGeometry.y > y)
	if (filteredWindows.length === 0) return currentIndex
	const sortedWindows = filteredWindows.sort((a, b) => b.window.ref.frameGeometry.y - a.window.ref.frameGeometry.y)
	return sortedWindows[0].index
}
export function focusLeft(windows: TiledWindowRef[], currentIndex: number): number {
	const { x, y } = windows[currentIndex].ref.frameGeometry
	const indexedWindows = windows.map((window, index) => ({
		window: window,
		index: index
	}))
	// Our goal is to find the window with the largest smaller y value
	// And the same x value
	const filteredWindows = indexedWindows
		.filter(w => w.window.ref.frameGeometry.y === y)
		.filter(w => w.window.ref.frameGeometry.x < x)
	if (filteredWindows.length === 0) return currentIndex
	const sortedWindows = filteredWindows.sort((a, b) => a.window.ref.frameGeometry.x - b.window.ref.frameGeometry.x)
	return sortedWindows[0].index
}
export function focusRight(windows: TiledWindowRef[], currentIndex: number): number {
	const { x, y } = windows[currentIndex].ref.frameGeometry
	const indexedWindows = windows.map((window, index) => ({
		window: window,
		index: index
	}))
	// Our goal is to find the window with the largest smaller y value
	// And the same x value
	const filteredWindows = indexedWindows
		.filter(w => w.window.ref.frameGeometry.y === y)
		.filter(w => w.window.ref.frameGeometry.x > x)
	if (filteredWindows.length === 0) return currentIndex
	const sortedWindows = filteredWindows.sort((a, b) => b.window.ref.frameGeometry.x - a.window.ref.frameGeometry.x)
	return sortedWindows[0].index
}
