import Window from '../node_modules/kwin-api/src/window'
import Workspace from '../node_modules/kwin-api/src/workspace'
import Monocle from './monocle'
import KWin from '../node_modules/kwin-api/src/kwin'
import Spiral from './spiral'
import { TilerContext } from './tilerTypes'

/**
 * Workspace is a global object provided by KWin
 * It let's us interact with everything on our desktop
 * This includes virtual destktops and windows
 */
declare const workspace: Workspace
declare const registerShortcut: KWin['registerShortcut']

// TODO move this helper function elsewhere
function fromEntries<K extends PropertyKey, V>(entries: [K, V][]): Record<K, V> {
	// create an empty and assert it to our mapped type
	const result = {} as Record<K, V>

	for (const [key, value] of entries) {
		result[key] = value;
	}

	return result;
}


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
	const desktops = fromEntries<string, Window[]>(
		workspace.desktops.map(d => [d.id, []])
	)
	workspace.windowList().forEach(window => {
		if (!window.normalWindow) return
		const { id } = workspace.desktops.find(
			d => d === window.desktops[0]
		)!
		desktops[id].push(window)
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

let { desktops, workspaceGeometry } = tylerInit()

const tilerList = [
	Monocle,
	Spiral
]

// List of contexts our tilers will share, mapped by desktopIndex
const tilerContexts = fromEntries(
	workspace.desktops.map(d => [
		d.id,
		new TilerContext(desktops[d.id], workspaceGeometry)
	])
)
// Instanciate all our tilers
const tilers = fromEntries(
	workspace.desktops.map(d => [
		d.id,
		tilerList.map(T => new T(tilerContexts[d.id]))
	])
)

const currentTilers = fromEntries(
	workspace.desktops.map(d => [
		d.id,
		tilers[d.id][0]
	])
)
// Create a list of indecies we can use to move to the next tiler
const tilerIndecies = fromEntries(
	workspace.desktops.map(d => [d.id, 0])
)


function updateDesktopID(): string {
	return workspace.desktops.find(d => workspace.currentDesktop === d)!.id
}


function changeDesktop(window: Window) {
	const di = updateDesktopID()
	const removeCalls = Object.values(tilerContexts).map(tiler => tiler.removeWindow(window))
	const windowRef = removeCalls.find(w => w != undefined)
	if (!windowRef) return
	tilerContexts[di].addWindowRef(windowRef)
	currentTilers[di].tile()
}

workspace.windowList().map(w => {
	w.desktopsChanged.connect(() => {
		changeDesktop(w)
	})
})

// Kick our first tiler off
var currentDesktopID = updateDesktopID()
currentTilers[currentDesktopID].tile()

// Begin all our hook logic

workspace.virtualScreenSizeChanged.connect(() => {
	console.log("Virtual screen size change detected")
	workspaceGeometry = getWorkspaceGeometry()
	Object.values(tilerContexts).forEach(c => c.workspaceGeometry = workspaceGeometry)
})

workspace.activitiesChanged.connect((e) => {
	console.log("Activity changed to: ", e)
})

workspace.currentDesktopChanged.connect(() => {
	currentDesktopID = updateDesktopID()
	currentTilers[currentDesktopID].tile()
})

function onFocusWindow(window: Window) {
	tilerContexts[currentDesktopID].onFocusWindow(window)
}

workspace.windowActivated.connect(onFocusWindow)

function focusLeft() {
	currentTilers[currentDesktopID].focusLeft()
}
function focusRight() {
	currentTilers[currentDesktopID].focusRight()
}
function focusUp() {
	currentTilers[currentDesktopID].focusUp()
}
function focusDown() {
	currentTilers[currentDesktopID].focusDown()
}
function toggleFloat() {
	tilerContexts[currentDesktopID].toggleFloat()
}

function moveUp() {
	currentTilers[currentDesktopID].moveUp()
}
function moveDown() {
	currentTilers[currentDesktopID].moveDown()
}
function moveLeft() {
	currentTilers[currentDesktopID].moveLeft()
}
function moveRight() {
	currentTilers[currentDesktopID].moveRight()
}

// Split functions (rearange the window sizes)
function moveSplitUp() {
	currentTilers[currentDesktopID].windowResizeUp()
}
function moveSplitDown() {
	currentTilers[currentDesktopID].windowResizeDown()
}
function moveSplitLeft() {
	currentTilers[currentDesktopID].windowResizeLeft()
}
function moveSplitRight() {
	currentTilers[currentDesktopID].windowResizeRight()
}

function switchTiler() {
	// Find current index
	const currentIndex = tilerIndecies[currentDesktopID]
	// Find next index
	const nextIndex = (currentIndex + 1) % tilerList.length
	tilerIndecies[currentDesktopID] = nextIndex
	// Switch current tiler
	currentTilers[currentDesktopID] = tilers[currentDesktopID][nextIndex]
	// TODO fix, messy
	tilerContexts[currentDesktopID].tiledWindows.forEach(
		w => w.ref.noBorder = false
	)
	// Trigger retile
	currentTilers[currentDesktopID].tile()
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

// Split shortcuts
registerShortcut(
	'Move Split Down',
	'Tyler: Move Split Down',
	'Meta+Alt+J',
	moveSplitDown
)
registerShortcut(
	'Move Split Up',
	'Tyler: Move Split Up',
	'Meta+Alt+K',
	moveSplitUp
)
registerShortcut(
	'Move Split Right',
	'Tyler: Move Split Right',
	'Meta+Alt+L',
	moveSplitRight
)
registerShortcut(
	'Move Split Left',
	'Tyler: Move Split Left',
	'Meta+Alt+H',
	moveSplitLeft
)

registerShortcut(
	'Toggle Floating',
	'Tyler: Toggle Floating',
	'Meta+F',
	toggleFloat
)

workspace.windowAdded.connect(window => {
	if (window.dock) {
		console.log(`Detected dock ${window.internalId} in windowAdded hook`)
		workspaceGeometry = getWorkspaceGeometry()
		Object.values(tilerContexts).forEach(tiler => {
			tiler.workspaceGeometry = workspaceGeometry
		})
	}
	if (
		!window.normalWindow ||
		window.dialog ||
		window.menu ||
		window.dock ||
		window.utility ||
		window.skipPager ||
		window.skipTaskbar
	) return
	window.desktopsChanged.connect(() => changeDesktop(window))
	tilerContexts[currentDesktopID].addWindow(window)
	currentTilers[currentDesktopID].tile()
	console.log("Current after adding focus index: ", tilerContexts[currentDesktopID].focusedIndex)
})

workspace.windowRemoved.connect(window => {
	console.log("Current index, outside scope", tilerContexts[currentDesktopID].focusedIndex)
	tilerContexts[currentDesktopID].removeWindow(window)
	currentTilers[currentDesktopID].tile()
})
