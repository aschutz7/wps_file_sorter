import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar.jsx';

export default function Sorter() {
	const [selectedFolder, setSelectedFolder] = useState('');
	const [outputFolder, setOutputFolder] = useState('');
	const [sorting, setSorting] = useState(false);
	const [progress, setProgress] = useState(0);

	useEffect(() => {
		// Listen to progress updates
		const handleProgress = (newProgress) => {
			setProgress(newProgress);
		};

		// Attach the listener when the component is mounted
		window.electron.on('progress', handleProgress);

		// Cleanup the listener when the component is unmounted
		return () => {
			// You can remove the listener if needed
			window.electron.off('progress', handleProgress);
		};
	}, []);

	const handleSort = async () => {
		if (sorting) {
			alert(
				"You're already sorting files. Please wait for that process to finish."
			);
			return;
		}
		setSorting(true);
		setProgress(0);

		try {
			// Invoke the sorting process from the main process
			const result = await window.electron.invoke(
				'sort-files',
				selectedFolder,
				outputFolder
			);

			setSorting(false);

			if (result) {
				alert(`Files have been sorted and moved to: ${result}`);
			}
		} catch (error) {
			console.error('Error sorting files:', error);
			alert('An error occurred while sorting the files.');
		}
	};

	return (
		<div className='bg-gray-900 text-white min-h-screen flex'>
			<Sidebar isCollapsible className='shrink-0' />
			<div className='flex-grow p-8'>
				<header className='text-center mb-8'>
					<h1 className='text-4xl font-bold'>File Sorter</h1>
					<p className='text-lg'>Organize your files by name</p>
				</header>
				<main className='max-w-3xl mx-auto space-y-6'>
					<div>
						<label className='block mb-2 text-lg'>
							Select Source Folder
						</label>
						<input
							type='text'
							placeholder='Enter source folder path'
							value={selectedFolder}
							onChange={(e) => setSelectedFolder(e.target.value)}
							className='w-full p-2 rounded bg-gray-700 text-white'
						/>
					</div>
					<div>
						<label className='block mb-2 text-lg'>
							Select Output Folder (Optional)
						</label>
						<input
							type='text'
							placeholder='Enter output folder path'
							value={outputFolder}
							onChange={(e) => setOutputFolder(e.target.value)}
							className='w-full p-2 rounded bg-gray-700 text-white'
						/>
					</div>
					<button
						disabled={sorting}
						onClick={handleSort}
						className='bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded shadow-lg'
					>
						Sort Files
					</button>

					{/* Progress bar */}
					{sorting && (
						<div className='mt-4'>
							<p className='text-lg mb-2'>
								Sorting Progress: {progress}%
							</p>
							<div className='w-full bg-gray-700 rounded'>
								<div
									className='bg-green-500 h-2 rounded'
									style={{ width: `${progress}%` }}
								></div>
							</div>
						</div>
					)}
				</main>
			</div>
		</div>
	);
}
