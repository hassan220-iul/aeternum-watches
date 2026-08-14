import { Outlet } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import ScrollProgressDial from '../common/ScrollProgressDial';
import ToastStack from '../common/ToastStack';

export default function Layout() {
  return (
    <>
      <a href="#main-content" className="skip-link">Skip to content</a>
      <Header />
      <main id="main-content" style={{ paddingTop: '84px' }}>
        <Outlet />
      </main>
      <Footer />
      <ScrollProgressDial />
      <ToastStack />
    </>
  );
}
