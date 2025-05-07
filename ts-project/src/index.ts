import Window from '../node_modules/kwin-api/src/window'
import Workspace from '../node_modules/kwin-api/src/workspace'
import Monocle from './monocle'
import KWin from '../node_modules/kwin-api/src/kwin'
import Spiral from './spiral'
import { TiledWindowRef } from './tilerTypes'

/**
 * Workspace is a global object provided by KWin
 * It let's us interact with everything on our desktop
 * This includes virtual destktops and windows
 */
declare const workspace: Workspace
declare const registerShortcut: KWin['registerShortcut']

function getWorkspaceGeometry() {
	const dockWindows = workspace.windowList().filter(w => w.dock)
	var workspaceGeometry: Workspace['virtualScreenGeometry'] = {
		x: workspace.virtualScreenGeometry.x,
		y: workspace.virtualScreenGeometry.y,
		width: workspace.virtualScreenGeometry.width,
		height: workspace.virtualScreenGeometry.height
	}
	dockWindows.forEach(w => {
		// If dock stretches across horizontally
		if (w.width === workspace.virtualScreenGeometry.width) {
			workspaceGeometry.height -= w.height
			if (w.y === 0) workspaceGeometry.y += w.height
		}
		// If dock stretches across vertically
		if (w.height === workspace.virtualScreenGeometry.height) {
			workspaceGeometry.width -= w.width
			if (w.x === 0) workspaceGeometry.x += w.width
		}
	})
	return workspaceGeometry
}

function getWindowsByDesktop() {
	const desktops: Window[][] = Array.from({
		length: workspace.desktops.length
	}, () => [])
	workspace.windowList().forEach(window => {
		if (!window.normalWindow) return
		const desktopIndex = workspace.desktops.findIndex(
			d => d === window.desktops[0]
		)
		desktops[desktopIndex].push(window)
	})
	return desktops
}

function tylerInit() {
	console.log("Tyler Init ------------------")
	const workspaceGeometry = getWorkspaceGeometry()
	const desktops = getWindowsByDesktop()
	return {
		desktops,
		workspaceGeometry
	}
}

const { desktops, workspaceGeometry } = tylerInit()

const tilerList = [
	Monocle,
	Spiral
]

// List of the availible tilers for the user to employ
const tilers = desktops.map(d => new tilerList[0](d, workspaceGeometry))
// Create a list of indecies we can use to move to the next tiler
const tilerIndecies = desktops.map(() => 0)

const windowsChangingDesktop: TiledWindowRef[] = []

function updateDesktopIndex(): number {
	return workspace.desktops.findIndex(d => workspace.currentDesktop === d)
}

let i = 0

function changeDesktop(window: Window) {
	console.log(i++)
	const di = updateDesktopIndex()
	const removeCalls = tilers.map(tiler => tiler.removeWindow(window))
	const windowRef = removeCalls.find(w => w != undefined)
	if (!windowRef) return
	tilers[di].addWindowRef(windowRef)
	tilers[di].tile()
}

workspace.windowList().map(w => {
	w.desktopsChanged.connect(() => {
		changeDesktop(w)
	})
})

var currentDesktopIndex = updateDesktopIndex()
tilers[currentDesktopIndex].tile()

workspace.currentDesktopChanged.connect(() => {
	currentDesktopIndex = updateDesktopIndex()
	windowsChangingDesktop.forEach(w => tilers[currentDesktopIndex].addWindowRef(w))
	windowsChangingDesktop.splice(0, windowsChangingDesktop.length)
	tilers[currentDesktopIndex].tile()
})

function onFocusWindow(window: Window) {
	tilers[currentDesktopIndex].onFocusWindow(window)
}

workspace.windowActivated.connect(onFocusWindow)

function focusLeft() {
	tilers[currentDesktopIndex].focusLeft()
}
function focusRight() {
	tilers[currentDesktopIndex].focusRight()
}
function focusUp() {
	tilers[currentDesktopIndex].focusUp()
}
function focusDown() {
	tilers[currentDesktopIndex].focusDown()
}
function toggleFloat() {
	tilers[currentDesktopIndex].toggleFloat()
}

function moveUp() {
	tilers[currentDesktopIndex].moveUp()
}
function moveDown() {
	tilers[currentDesktopIndex].moveDown()
}
function moveLeft() {
	tilers[currentDesktopIndex].moveLeft()
}
function moveRight() {
	tilers[currentDesktopIndex].moveRight()
}

function switchTiler() {
	// Find the current index in our list
	const nextIndex = (tilerIndecies[currentDesktopIndex] + 1) % tilerList.length
	const currentFocusIndex = tilers[currentDesktopIndex].currentIndex
	tilerIndecies[currentDesktopIndex] = nextIndex
	// Get the tiler at the next index
	// Get the current state of the tiler
	const windows = tilers[currentDesktopIndex].windows
	// TODO Clean this up
	windows.forEach(w => w.ref.noBorder = false)
	windows.forEach
	// Push that into a new tiler
	tilers[currentDesktopIndex] = new tilerList[nextIndex](
		[],
		workspaceGeometry
	)
	tilers[currentDesktopIndex].windows = windows
	tilers[currentDesktopIndex].currentIndex = currentFocusIndex
	tilers[currentDesktopIndex].tile()
}

registerShortcut(
	'Switch Tiler',
	'Tyler: Switch Tiler',
	'Meta+\\',
	switchTiler
)
registerShortcut(
	'Focus Left',
	'Tyler: Focus Left',
	'Meta+H',
	focusLeft
)
registerShortcut(
	'Focus Right',
	'Tyler: Focus Right',
	'Meta+L',
	focusRight
)
registerShortcut(
	'Focus Up',
	'Tyler: Focus Up',
	'Meta+K',
	focusUp
)
registerShortcut(
	'Focus Down',
	'Tyler: Focus Down',
	'Meta+J',
	focusDown
)

registerShortcut(
	'Move Up',
	'Tyler: Move Up',
	'Meta+Shift+K',
	moveUp
)
registerShortcut(
	'Move Down',
	'Tyler: Move Down',
	'Meta+Shift+J',
	moveDown
)
registerShortcut(
	'Move Left',
	'Tyler: Move Left',
	'Meta+Shift+H',
	moveLeft
)
registerShortcut(
	'Move Right',
	'Tyler: Move Right',
	'Meta+Shift+L',
	moveRight
)

registerShortcut(
	'Toggle Floating',
	'Tyler: Toggle Floating',
	'Meta+F',
	toggleFloat
)

workspace.windowAdded.connect(window => {
	if (!window.normalWindow || window.dialog || window.fullScreen || window.menu || window.dock) return
	window.desktopsChanged.connect(() => changeDesktop(window))
	tilers[currentDesktopIndex].addWindow(window)
})

workspace.windowRemoved.connect(window => {
	tilers[currentDesktopIndex].removeWindow(window)
	tilers[currentDesktopIndex].tile()
})
