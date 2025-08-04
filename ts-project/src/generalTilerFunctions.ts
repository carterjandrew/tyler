import QPoint from '../node_modules/kwin-api/src/qt/qpoint'
import { TiledWindowRef } from './tilerTypes'

/** 
 * Function that calculates the euclidian distance between two points
 */
export function euDist(p1: QPoint, p2: QPoint): number {
	return Math.abs(p1.x - p2.x) + Math.abs(p1.y - p2.y)
}

/**
 * Function for focusing up.
 * It will fist try to use the last window index if it is passed in
 * Otherwise, it will pick the window above it with the least euclidan distance
 * It will return the index it is moving to
 */
export function findUp(windows: TiledWindowRef[], currentIndex: number, toIndex?: number): number {
	if (toIndex && windows[toIndex] && toIndex != currentIndex) {
		return toIndex
	}
	const { y } = windows[currentIndex].ref
	const indexedWindows = windows.map((window, index) => ({
		window: window,
		index: index
	}))
	// Our goal is to find the window with the largest smaller y value
	// And the same x value
	const filteredWindows = indexedWindows
		.filter(w => w.window.ref.frameGeometry.y < y)
	if (filteredWindows.length === 0) return currentIndex
	const sortedWindows = filteredWindows.sort((a, b) =>
		euDist(windows[currentIndex].ref.pos, a.window.ref.pos) - euDist(windows[currentIndex].ref.pos, b.window.ref.pos)
	)
	return sortedWindows[0].index
}
/**
 * Function does the same but for down
 */
export function findDown(windows: TiledWindowRef[], currentIndex: number, toIndex?: number): number {
	if (toIndex && windows[toIndex] && toIndex != currentIndex) {
		return toIndex
	}
	const { x, y, height } = windows[currentIndex].ref.frameGeometry
	const indexedWindows = windows.map((window, index) => ({
		window: window,
		index: index
	}))
	// Our goal is to find the window with the largest smaller y value
	// And the same x value
	const filteredWindows = indexedWindows
		.filter(w => Math.floor(w.window.ref.frameGeometry.y) >= Math.floor(y + height))
	if (filteredWindows.length === 0) return currentIndex
	const sortedWindows = filteredWindows.sort((a, b) =>
		euDist(windows[currentIndex].ref.pos, a.window.ref.pos) - euDist(windows[currentIndex].ref.pos, b.window.ref.pos)
	)
	return sortedWindows[0].index
}
export function findLeft(windows: TiledWindowRef[], currentIndex: number, toIndex?: number): number {
	if (toIndex && windows[toIndex] && toIndex != currentIndex) {
		return toIndex
	}
	const { x, y } = windows[currentIndex].ref.frameGeometry
	const indexedWindows = windows.map((window, index) => ({
		window: window,
		index: index
	}))
	// Our goal is to find the window with the largest smaller y value
	// And the same x value
	const filteredWindows = indexedWindows
		.filter(w => w.window.ref.frameGeometry.x < x)
	if (filteredWindows.length === 0) return currentIndex
	const sortedWindows = filteredWindows.sort((a, b) =>
		euDist(windows[currentIndex].ref.pos, a.window.ref.pos) - euDist(windows[currentIndex].ref.pos, b.window.ref.pos)
	)
	return sortedWindows[0].index
}
export function findRight(windows: TiledWindowRef[], currentIndex: number, toIndex?: number): number {
	if (toIndex && windows[toIndex] && toIndex != currentIndex) {
		return toIndex
	}
	const { x, width } = windows[currentIndex].ref
	const indexedWindows = windows.map((window, index) => ({
		window: window,
		index: index
	}))
	// Our goal is to find the window with the largest smaller y value
	// And the same x value
	const filteredWindows = indexedWindows
		.filter(w => Math.floor(w.window.ref.frameGeometry.x) >= Math.floor(x + width))
	if (filteredWindows.length === 0) return currentIndex
	const sortedWindows = filteredWindows.sort((a, b) =>
		euDist(windows[currentIndex].ref.pos, a.window.ref.pos) - euDist(windows[currentIndex].ref.pos, b.window.ref.pos)
	)
	return sortedWindows[0].index
}
