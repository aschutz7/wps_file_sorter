import * as React from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './components/Home.jsx';
import Instructions from './components/Instructions.jsx';
import Sorter from './components/Sorter.jsx';
import './index.css';

const App = () => {
	return (
		<Router>
			<Routes>
				<Route path='/' element={<Home />} />
				<Route path='/instructions' element={<Instructions />} />
				<Route path='/sorter' element={<Sorter />} />
			</Routes>
		</Router>
	);
};

const root = createRoot(document.getElementById('root'));
root.render(<App />);
