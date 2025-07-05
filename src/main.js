import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import path from 'node:path';
import fs from 'fs';
import os from 'os';
import started from 'electron-squirrel-startup';
import { updateElectronApp, UpdateSourceType } from 'update-electron-app';
const { shell } = require('electron');

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

async function logErrorToFile(error) {
	const configDirectory = path.join(
		os.homedir(),
		'AppData',
		'Local',
		'WPS Programs',
		'File Sorter'
	);
	const errorsPath = path.join(configDirectory, 'errors.json');

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

	const errors = JSON.parse(fs.readFileSync(errorsPath, 'utf-8'));

	const errorLog = {
		date: new Date().toISOString(),
		error: {
			stack: error.stack || 'No stack available',
			message: error.message,
			name: error.name || 'Unknown',
		},
		errorId: generateUniqueErrorId(),
	};

	errors.push(errorLog);

	fs.writeFileSync(errorsPath, JSON.stringify(errors, null, 2), 'utf-8');
}

function generateUniqueErrorId() {
	return (
		Math.random().toString(36).substr(2, 9) + Date.now().toString(36)
	).toUpperCase();
}

function extractIdentifier(fileName) {
	const cleanedFileName = fileName
		.replace(/[^\w\s.-]/g, '')
		.replace('-0-', '-')
		.trim();

	const regex = /\d{2}-\d{3}-[A-Z0-9]+-\d{2}-\d{3}/i;
	const match = cleanedFileName.match(regex);

	if (!match) return '';

	const parts = match[0].split('-');
	if (parts.length !== 5) return '';

	const [p1, p2, p3, p4, p5] = parts;

	return `${p1}${p2}0${p3}${p4}${p5}`;
}

// const tests = [
// 	['09-014-0-AA01-10-001 other text.pdf', '090140AA0110001'],
// 	['09-014-0-AA01-10-001_LR.pdf', '090140AA0110001'],
// 	['09-014-010-10-001_LR.pdf', '09014001010001'],
// 	['09-014-B948-93-001_InvSketch_2025-05.pdf', '090140B94893001'],
// 	['09-014-C026-87-001_LR_2025-05.pdf', '090140C02687001'],
// 	['09-014-1234-56-789_RandomText.pdf', '090140123456789'],
// 	['invalid-file-name.pdf', ''],
// 	['2025-05_09-014-AA01-10-001.pdf', '090140AA0110001'],
// 	['ExtraText_09-014-AA01-10-001_Tail.pdf', '090140AA0110001'],
// 	['file without identifier.pdf', ''],
// 	['21-024-0-0482-02-007_ScourSumSht_2024_10.pdf', '210240048202007'],
// 	['21-024-0-0696-03-008_ScourSumSht_2024_06.pdf', '210240069603008'],
// ];

// let passed = 0;
// for (const [input, expected] of tests) {
// 	const result = extractIdentifier(input);
// 	const ok = result === expected;
// 	console.log(
// 		`${
// 			ok ? '✅ PASS' : '❌ FAIL'
// 		} | Input: "${input}" | Expected: "${expected}" | Got: "${result}"`
// 	);
// 	if (ok) passed++;
// }

// console.log(`\n${passed}/${tests.length} tests passed.`);

async function sortFilesIntoFolders(
	files,
	sourceFolder,
	outputFolder,
	setProgress,
	mainWindow
) {
	for (let i = 0; i < files.length; i++) {
		const file = files[i];
		const filePath = path.join(sourceFolder, file.fileName);

		const stats = await fs.promises.stat(filePath);
		if (!stats.isFile()) {
			continue;
		}

		const identifier = extractIdentifier(file.fileName);

		if (!identifier || String(identifier).length === 0) {
			continue;
		}

		// if (!identifier || String(identifier).length !== 15) {
		// 	continue;
		// }

		const folderPath = path.join(outputFolder, identifier);
		await createFolderIfNotExists(folderPath);

		const destPath = path.join(folderPath, file.fileName);

		try {
			await fs.promises.rename(filePath, destPath);
			setProgress(((i + 1) / files.length) * 100);
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

ipcMain.handle('check-for-updates', () => {
	const updater = updateElectronApp({
		updateInterval: '1 hour',
		notifyUser: true,
		// updateSource: {
		// 	type: 'github',
		// 	repo: 'aschutz7/wps_file_sorter',
		// 	owner: 'aschutz7',
		// 	name: 'wps_file_sorter',
		// },
		updateSource: {
			type: UpdateSourceType.ElectronPublicUpdateService,
			repo: 'aschutz7/wps_file_sorter',
		},
		logger: require('electron-log'),
	});
});

ipcMain.on('open-external', (event, url) => {
	shell.openExternal(url);
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

	if (!fs.existsSync(configPath)) {
		const defaultConfig = {
			firstLaunch: false,
			version: app.getVersion(),
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

	config.version = app.getVersion();
	fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8');

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
		const mainWindow = BrowserWindow.getAllWindows()[0];
		await sortFilesIntoFolders(
			sortedFiles,
			sourceFolder,
			outputFolder || sourceFolder,
			(progress) => mainWindow.webContents.send('progress', progress),
			mainWindow
		);

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
		fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8');

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

const createWindow = () => {
	const mainWindow = new BrowserWindow({
		width: 800,
		height: 600,
		webPreferences: {
			preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
			contextIsolation: true,
			nodeIntegration: false,
		},
		autoHideMenuBar: true,
		icon: __dirname + '/icon.ico',
	});

	const updater = updateElectronApp({
		updateInterval: '1 hour',
		notifyUser: true,
		// updateSource: {
		// 	type: 'github',
		// 	repo: 'aschutz7/wps_file_sorter',
		// 	owner: 'aschutz7',
		// 	name: 'wps_file_sorter',
		// },
		// updateSource: {
		// 	type: UpdateSourceType.ElectronPublicUpdateService,
		// 	repo: 'aschutz7/wps_file_sorter',
		// },
		logger: require('electron-log'),
	});

	mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);
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
