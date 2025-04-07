import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar.jsx';

export default function Instructions() {
	const [version, setVersion] = useState('');

	useEffect(() => {
		window.electron.getConfig().then((config) => {
			setVersion(config.version);
		});
	}, []);

	return (
		<div className='bg-gray-900 text-white min-h-screen flex'>
			<Sidebar isCollapsible className='shrink-0' version={version} />
			<div className='flex-grow p-8'>
				<header className='text-center mb-8'>
					<h1 className='text-4xl font-bold mb-2'>Instructions</h1>
					<p className='text-lg'>
						Learn how to use the WPS File Sorter
					</p>
				</header>
				<main className='max-w-4xl mx-auto space-y-6'>
					<section>
						<h2 className='text-2xl font-semibold mb-2'>
							Step 1: Choose Folder(s)
						</h2>
						<p>
							Select the folder containing the files you want to
							organize.
							<br />
							Optionally: if you want to, you can specify an
							output folder. If it is not provided, the files will
							be organized into files in the source directory.
						</p>
					</section>
					<section>
						<h2 className='text-2xl font-semibold mb-2'>
							Step 2: Sort Your Files
						</h2>
						<p>
							Click the sort button to begin the process. The
							sorter will move the files into newly created
							folders based on their extracted identifiers.
						</p>
					</section>
					<section>
						<h2 className='text-2xl font-semibold mb-2'>
							That&apos;s it!
						</h2>
						<p>
							If an error occurs, please notify someone from WPS
							Engineering of this issue including information such
							as a screenshot of the error message and a brief
							description of what you were doing that caused the
							error.
						</p>
					</section>
					<footer className='text-center mt-8'>
						<p>Ready to get started?</p>
						<button
							onClick={() => (window.location.href = '#/sorter')}
							className='bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded shadow-lg mt-2'
						>
							Start Sorting
						</button>
					</footer>
				</main>
			</div>
		</div>
	);
}
