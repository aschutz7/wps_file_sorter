import { app, BrowserWindow, ipcMain, dialog, Notification } from 'electron';
import path from 'node:path';
import fs from 'fs';
import os from 'os';
import started from 'electron-squirrel-startup';
import { autoUpdater } from 'electron-updater';

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
	app.quit();
}

async function createFolderIfNotExists(folderPath) {
	try {
		if (!fs.existsSync(folderPath)) {
			await fs.promises.mkdir(folderPath, { recursive: true });
		}
	} catch (error) {
		console.error(`Failed to create folder ${folderPath}:`, error);
		await logErrorToFile(error);
		throw error;
	}
}

async function sortFilesIntoFolders(
	files,
	sourceFolder,
	outputFolder = sourceFolder,
	setProgress
) {
	for (let i = 0; i < files.length; i++) {
		const file = files[i];
		const filePath = path.join(sourceFolder, file.fileName);

		// Skip directories
		const stats = await fs.promises.stat(filePath);
		if (!stats.isFile()) {
			continue;
		}

		// Extract identifier
		const identifier = extractIdentifier(file.fileName);

		// Skip files without a valid identifier
		if (!identifier) {
			continue;
		}

		// Create folder and move file
		const folderPath = path.join(outputFolder, identifier);
		await createFolderIfNotExists(folderPath);

		const destPath = path.join(folderPath, file.fileName);

		try {
			await fs.promises.rename(filePath, destPath); // Move file to destination folder
			setProgress(((i + 1) / files.length) * 100); // Update progress
			// Send progress to the renderer process
			mainWindow.webContents.send(
				'progress',
				((i + 1) / files.length) * 100
			);
		} catch (error) {
			console.error(`Failed to move file ${file.fileName}:`, error);
			await logErrorToFile(error);
			throw error;
		}
	}
}

async function logErrorToFile(error) {
	const configDirectory = path.join(
		os.homedir(),
		'AppData',
		'Local',
		'WPS Programs',
		'File Sorter'
	);
	const errorsPath = path.join(configDirectory, 'errors.json');

	// Ensure the errors.json file exists
	if (!fs.existsSync(errorsPath)) {
		const defaultErrors = [
			{
				date: new Date().toISOString(),
				error: {
					stack: 'No errors yet',
					message: 'No errors',
					name: 'Info',
				},
				errorId: '00000000-0000-0000-0000-000000000000',
			},
		];
		fs.writeFileSync(
			errorsPath,
			JSON.stringify(defaultErrors, null, 2),
			'utf-8'
		);
	}

	// Read the current errors from errors.json
	const errors = JSON.parse(fs.readFileSync(errorsPath, 'utf-8'));

	// Log the new error
	const errorLog = {
		date: new Date().toISOString(),
		error: {
			stack: error.stack || 'No stack available',
			message: error.message,
			name: error.name || 'Unknown',
		},
		errorId: generateUniqueErrorId(),
	};

	// Add new error to the array
	errors.push(errorLog);

	// Write updated errors array back to the file
	fs.writeFileSync(errorsPath, JSON.stringify(errors, null, 2), 'utf-8');
}

function generateUniqueErrorId() {
	return (
		Math.random().toString(36).substr(2, 9) + Date.now().toString(36)
	).toUpperCase();
}

function extractIdentifier(fileName) {
	const cleanedFileName = fileName.replace(/[^\w\s-]/g, '').trim();
	const normalizedFileName = cleanedFileName.replace(/-0-/g, '-');
	const regex = /(\d{2}-\d{3}-\d{4}-\d{2}-\d{3})/;
	const match = normalizedFileName.match(regex);
	if (match) {
		return match[1].replace(/-/g, '');
	}
	return '';
}

const createWindow = () => {
	const mainWindow = new BrowserWindow({
		width: 800,
		height: 600,
		webPreferences: {
			preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
		},
		autoHideMenuBar: true,
		icon: __dirname + '/icon.ico',
	});

	mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);

	autoUpdater.setFeedURL({
		provider: 'github',
		repo: 'your-repo',
		owner: 'your-username',
		token: 'your-personal-access-token', 
	});

	autoUpdater.checkForUpdatesAndNotify();

	autoUpdater.on('update-available', () => {
		new Notification({
			title: 'Update Available',
			body: 'A new version is available, downloading now.',
		}).show();
	});

	autoUpdater.on('update-downloaded', () => {
		new Notification({
			title: 'Update Ready',
			body: 'Update downloaded, will be installed on app restart.',
		}).show();
		app.quit();
	});

	autoUpdater.on('error', (err) => {
		console.error('Error during update:', err);
		new Notification({
			title: 'Update Error',
			body: 'Failed to check for updates.',
		}).show();
	});

	ipcMain.handle('get-config', () => {
		const configDirectory = path.join(
			os.homedir(),
			'AppData',
			'Local',
			'WPS Programs',
			'File Sorter'
		);

		if (!fs.existsSync(configDirectory)) {
			fs.mkdirSync(configDirectory, { recursive: true });
		}

		const configPath = path.join(configDirectory, 'config.json');
		const errorsPath = path.join(configDirectory, 'errors.json');

		if (!fs.existsSync(configPath)) {
			const defaultConfig = {
				firstLaunch: false,
				version: '1.0.0a',
				lastOpened: new Date().toISOString(),
				filesMoved: 0,
			};

			fs.writeFileSync(
				configPath,
				JSON.stringify(defaultConfig, null, 2),
				'utf-8'
			);
			return defaultConfig;
		}

		const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
		return config;
	});

	ipcMain.handle('sort-files', async (event, sourceFolder, outputFolder) => {
		try {
			if (!sourceFolder) {
				dialog.showErrorBox(
					'Error Sorting Files',
					'Source folder not provided'
				);
				return null;
			}

			if (!fs.existsSync(sourceFolder)) {
				dialog.showErrorBox(
					'Error Sorting Files',
					'Source directory does not exist'
				);
				return null;
			}

			if (outputFolder && !fs.existsSync(outputFolder)) {
				dialog.showErrorBox(
					'Error Sorting Files',
					'Output directory was provided but does not exist'
				);
				return null;
			}

			const files = await fs.promises.readdir(sourceFolder);
			if (!files.length) {
				dialog.showErrorBox(
					'Error Sorting Files',
					'No files found in source directory'
				);
				return null;
			}

			const sortedFiles = files.map((file) => ({ fileName: file }));
			await sortFilesIntoFolders(
				sortedFiles,
				sourceFolder,
				outputFolder || sourceFolder,
				(progress) => mainWindow.webContents.send('progress', progress)
			);

			// Increment filesMoved count in config
			const configPath = path.join(
				os.homedir(),
				'AppData',
				'Local',
				'WPS Programs',
				'File Sorter',
				'config.json'
			);
			const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
			config.filesMoved += files.length;
			fs.writeFileSync(
				configPath,
				JSON.stringify(config, null, 2),
				'utf-8'
			);

			return outputFolder || sourceFolder;
		} catch (error) {
			console.error('Error in sort-files handler:', error);
			dialog.showErrorBox(
				'Error Sorting Files',
				'Failed to sort the files: ' + error.message
			);
			return null;
		}
	});
};

app.whenReady().then(() => {
	createWindow();

	app.on('activate', () => {
		if (BrowserWindow.getAllWindows().length === 0) {
			createWindow();
		}
	});
});

app.on('window-all-closed', () => {
	if (process.platform !== 'darwin') {
		app.quit();
	}
});
