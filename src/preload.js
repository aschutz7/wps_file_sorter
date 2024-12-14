const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
	getConfig: () => ipcRenderer.invoke('get-config'),
	getErrors: () => ipcRenderer.invoke('get-errors'),
	sortFiles: (sourceFolder, outputFolder) =>
		ipcRenderer.invoke('sort-files', sourceFolder, outputFolder),
	on: (channel, callback) => {
		const validChannels = [
			'progress',
			'update-available',
			'update-downloaded',
		];
		if (validChannels.includes(channel)) {
			ipcRenderer.on(channel, (event, ...args) => callback(...args));
		} else {
			console.warn(
				`Attempted to listen on an invalid channel: ${channel}`
			);
		}
	},
	off: (channel, callback) => {
		const validChannels = [
			'progress',
			'update-available',
			'update-downloaded',
		];
		if (validChannels.includes(channel)) {
			ipcRenderer.removeListener(channel, callback);
		} else {
			console.warn(
				`Attempted to remove listener from an invalid channel: ${channel}`
			);
		}
	},
});
