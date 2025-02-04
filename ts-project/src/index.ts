import { VirtualDesktop, Window } from './types'
declare const workspace: {
		desktops: VirtualDesktop[],
		windowList: () => Window[]
}
const windowList = workspace.windowList()
console.log("Window list length:", windowList.length)
console.log("Window list:", windowList)
