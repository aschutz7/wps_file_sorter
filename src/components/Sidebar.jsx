import React, { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, Home, Info, Folder, Bug } from 'lucide-react';

const openBugReport = () => {
	window.electron.openExternal('https://forms.gle/iCbg2LCn6wWU9fsS8');
};

const Sidebar = ({ width = 175, isCollapsible = true, className = '' }) => {
	const [isOpen, setIsOpen] = useState(true);
	const [sidebarWidth, setSidebarWidth] = useState(width);
	const [isResizing, setIsResizing] = useState(false);
	const [isModalOpen, setIsModalOpen] = useState(false);
	const toggleSidebar = () => {
		if (isCollapsible) {
			setIsOpen(!isOpen);
		}
	};

	const startResize = useCallback(
		(e) => {
			if (!isCollapsible) return;
			setIsResizing(true);

			const handleMouseMove = (e) => {
				const newWidth = Math.max(100, Math.min(e.clientX, 400));
				setSidebarWidth(newWidth);
			};

			const handleMouseUp = () => {
				setIsResizing(false);
				document.removeEventListener('mousemove', handleMouseMove);
				document.removeEventListener('mouseup', handleMouseUp);
			};

			document.addEventListener('mousemove', handleMouseMove);
			document.addEventListener('mouseup', handleMouseUp);
		},
		[isCollapsible]
	);

	const Modal = () => (
		<div className='fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50'>
			<div className='bg-white rounded-lg shadow-lg p-6 w-96 text-black'>
				<h2 className='text-lg font-bold mb-2'>Report a Bug</h2>
				<p className='mb-4'>
					If you encounter a bug, please click the button below to
					fill out a bug report form in your browser.
				</p>
				<button
					onClick={openBugReport}
					className='px-4 py-2 mr-2 bg-blue-600 text-white rounded hover:bg-blue-500'
				>
					Open Bug Report Form
				</button>
				<button
					onClick={() => setIsModalOpen(false)}
					className='bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded'
				>
					Close
				</button>
			</div>
		</div>
	);

	return (
		<div
			className={`relative group ${className}`}
			style={{
				width: isOpen ? `${sidebarWidth}px` : '60px',
				transition: 'width 0.3s ease-in-out',
				overflow: 'hidden',
			}}
		>
			<div
				className='bg-gray-800 h-full p-4 flex flex-col items-center justify-between space-y-4 relative'
				style={{ width: isOpen ? `${sidebarWidth}px` : '60px' }}
			>
				{isCollapsible && (
					<button
						onClick={toggleSidebar}
						className='absolute top-2 right-2 z-10 text-white mb-1'
						style={{
							marginRight: isOpen ? '10px' : '0px',
						}}
					>
						{isOpen ? <X size={24} /> : <Menu size={24} />}
					</button>
				)}

				<div className='flex flex-col items-center justify-center space-y-4 w-full mb-2'>
					<Link
						to='/'
						className='text-white hover:text-blue-400 flex items-center space-x-2'
					>
						<Home size={24} />
						{isOpen && (
							<span className='text-lg font-bold'>Home</span>
						)}
					</Link>
					<Link
						to='/instructions'
						className='text-white hover:text-blue-400 flex items-center space-x-2'
					>
						<Info size={24} />
						{isOpen && (
							<span className='text-lg font-bold'>
								Instructions
							</span>
						)}
					</Link>
					<Link
						to='/sorter'
						className='text-white hover:text-blue-400 flex items-center space-x-2'
					>
						<Folder size={24} />
						{isOpen && (
							<span className='text-lg font-bold'>
								File Sorter
							</span>
						)}
					</Link>

					<button
						onClick={() => setIsModalOpen(true)}
						className='text-white hover:text-blue-400 flex items-center space-x-2'
					>
						<Bug size={24} />
						{isOpen && (
							<span className='text-lg font-bold text-nowrap'>
								Report a Bug
							</span>
						)}
					</button>
				</div>

				{isCollapsible && (
					<div
						className='absolute right-0 top-1/2 w-2 h-20 bg-gray-600 cursor-col-resize hover:bg-gray-500'
						style={{
							transform: 'translateX(100%)',
							userSelect: 'none',
						}}
						onMouseDown={startResize}
					/>
				)}
			</div>

			{isModalOpen && <Modal />}

			{isResizing && (
				<div
					className='fixed inset-0 z-50 cursor-col-resize'
					style={{
						pointerEvents: 'auto',
						background: 'rgba(0,0,0,0.001)',
					}}
				/>
			)}
		</div>
	);
};

export default Sidebar;
