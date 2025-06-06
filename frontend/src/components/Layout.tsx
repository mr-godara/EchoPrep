import { Outlet } from 'react-router-dom';
import Navbar from './Navbar.js';
import Footer from './Footer.js';

const Layout = () => {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-grow">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default Layout;