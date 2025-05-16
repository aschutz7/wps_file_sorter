import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar.jsx';

export default function Home() {
	const [updateAvailable, setUpdateAvailable] = useState(false);
	const [downloading, setDownloading] = useState(false);
	const [version, setVersion] = useState('');

	useEffect(() => {
		window.electron.getConfig().then((config) => {
			setVersion(config.version);
		});

		const handleUpdateAvailable = () => {
			setUpdateAvailable(true);
			new Notification('Update Available', {
				body: 'A new version is available! Click here to install.',
			});
		};

		const handleUpdateDownloaded = () => {
			setDownloading(false);
			setUpdateAvailable(false);
			new Notification('Update Ready', {
				body: 'Update downloaded. Restart the app to apply.',
			});
		};

		window.electron.on('update-available', handleUpdateAvailable);
		window.electron.on('update-downloaded', handleUpdateDownloaded);

		return () => {
			window.electron.off('update-available', handleUpdateAvailable);
			window.electron.off('update-downloaded', handleUpdateDownloaded);
		};
	}, []);

	const handleCheckForUpdates = () => {
		setDownloading(true);
		window.electron.invoke('check-for-updates');
	};

	return (
		<div className='bg-gray-900 text-white min-h-screen flex'>
			<Sidebar isCollapsible className='shrink-0' version={version} />
			<div className='flex-grow flex flex-col items-center justify-center'>
				<header className='text-center'>
					<h1 className='text-5xl font-bold'>
						WPS Engineering LLC
						<br />
						File Sorter
						test home page change
					</h1>
				</header>

				<div className='space-y-4 space-x-3'>
					<button
						onClick={() =>
							(window.location.href = '#/instructions')
						}
						className='bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded shadow-lg'
					>
						Instructions
					</button>
					<button
						onClick={() => (window.location.href = '#/sorter')}
						className='bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded shadow-lg'
					>
						Start Sorting
					</button>

					{updateAvailable && !downloading && (
						<div className='bg-yellow-500 text-white p-4 mt-4 rounded'>
							<p>An update is available!</p>
							<button
								onClick={handleCheckForUpdates}
								className='bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded'
							>
								Download Update
							</button>
						</div>
					)}
					{downloading && <p>Downloading update...</p>}
				</div>
			</div>
		</div>
	);
}
