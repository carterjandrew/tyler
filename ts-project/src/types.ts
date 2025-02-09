export type QSize = {
	height: number,
	width: number,
	isEmpty: boolean,
	isNull: boolean,
	isValid: boolean,
	scale: (width: number, height: number) => void,
	setHeight: (height: number) => void,
	setWidth: (width: number) => void
}

export type QPoint = {
	x: number,
	y: number,
	setX: (x: number) => void,
	setY: (y: number) => void,
	manhattanLength: number
}

export type QRect = {
	height: number,
	width: number,
	x: number,
	y: number,
	left: number,
	right: number,
	top: number,
	bottom: number,
	bottomLeft: QPoint,
	bottomRight: QPoint,
	topLeft: QPoint,
	topRight: QPoint,
	center: QPoint,
	size: QSize,
	setWidth: (x: number) => void,
	setHeight: (y: number) => void,
	setX: (x: number) => void,
	setY: (y: number) => void
}

/**
 * This defines a signal
 * Basially, they are used to trigger a funcion during a specific event
 * By calling the connect object we can trigger our event 
 */
export type Signal <T extends (...args: any[]) => void>= {
		connect: (listener: T) => void
}

export type Window = {
		internalId: string
		dock: boolean,
		toolbar: boolean,
		menu: boolean,
		normalWindow: boolean,
		splash: boolean,
		notification: boolean,
		active: boolean,
		minSize: QSize,
		maxSize: QSize,
		move: boolean,
		movable: boolean,
		bufferGeometry: QRect,
		clientGeometry: QRect,
		pos: QPoint,
		size: QPoint,
		x: number, 
		y: number,
		width: number,
		height: number,
		resourceName: string,
		fullScreen: boolean,
		desktops: VirtualDesktop[]
		onAllDesktops: boolean,
		frameGeometry: QRect,
		noBorder: boolean
}

/**
 * A key component we need to handle tiling:
 * The virtual desktops! 
 * This defines the area upon each tiler can enact it's tiling
 */
export type VirtualDesktop = {
		id: string,
		x11DesktopNumber: number,
		name: string,
		nameChanged: Signal<(name: string) => void>,
		aboutToBeDestroyed: Signal<() => void>,
}

export type VirtualScreenSize = QSize
export type VirtualScreenGeometry = QRect
export type cursorPos = QPoint
export type desktopGridSize = QSize

