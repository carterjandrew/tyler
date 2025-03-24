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

const tilers = desktops.map(d => new Spiral(d, workspaceGeometry))

const windowsChangingDesktop: TiledWindowRef[] = []

function changeDesktop(window: Window) {
	const removeCalls = tilers.map(tiler => tiler.removeWindow(window))
	const windowRef = removeCalls.filter(wr => wr)[0]!
	windowsChangingDesktop.push(windowRef)
}

function updateDesktopIndex(): number {
	return workspace.desktops.findIndex(d => workspace.currentDesktop === d)
}
var currentDesktopIndex = updateDesktopIndex()
tilers[currentDesktopIndex].tile()

workspace.currentDesktopChanged.connect(() => {
	currentDesktopIndex = updateDesktopIndex()
	console.log(windowsChangingDesktop.length)
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

workspace.windowList().map(
	w => w.desktopsChanged.connect(
		() => changeDesktop(w)
	)
)

workspace.windowAdded.connect(window => {
	if (!window.normalWindow || window.dialog || window.fullScreen || window.menu || window.dock) return
	window.desktopsChanged.connect(() => changeDesktop(window))
	tilers[currentDesktopIndex].addWindow(window)
})

workspace.windowRemoved.connect(window => {
	tilers[currentDesktopIndex].removeWindow(window)
})
