import Window from '../node_modules/kwin-api/src/window'
import Workspace from '../node_modules/kwin-api/src/workspace'
import Monocle from './monocle'
import KWin from '../node_modules/kwin-api/src/kwin'

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

const tilers = desktops.map(d => new Monocle(d, workspaceGeometry))

function updateDesktopIndex(): number {
	return workspace.desktops.findIndex(d => workspace.currentDesktop === d)
}
var currentDesktopIndex = updateDesktopIndex()
tilers[currentDesktopIndex].tile()

workspace.currentDesktopChanged.connect(() => {
	currentDesktopIndex = updateDesktopIndex()
	tilers[currentDesktopIndex].tile()
})

function focusLeft() {
	tilers[currentDesktopIndex].focusLeft()
}

registerShortcut(
	'Focus Left',
	'Tyler: Focus Left',
	'Meta,H',
	focusLeft
)

workspace.windowAdded.connect(window => {
	tilers[currentDesktopIndex].addWindow(window)
})

workspace.windowRemoved.connect(window => {
	tilers[currentDesktopIndex].removeWindow(window)
})
