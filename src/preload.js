const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
	getConfig: () => ipcRenderer.invoke('get-config'),
	getErrors: () => ipcRenderer.invoke('get-errors'),
	sortFiles: (sourceFolder, outputFolder) =>
		ipcRenderer.invoke('sort-files', sourceFolder, outputFolder),

	// Event listener for progress
	on: (channel, callback) => {
		ipcRenderer.on(channel, (event, ...args) => callback(...args));
	},

	off: (channel, callback) => {
		ipcRenderer.removeListener(channel, callback);
	},
});
