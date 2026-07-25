import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AppShell from './components/layout/AppShell.jsx';
import Home from './pages/Home.jsx';
import Discover from './pages/Discover.jsx';
import BookDetail from './pages/BookDetail.jsx';
import Reader from './pages/Reader.jsx';
import Library from './pages/Library.jsx';
import Ranking from './pages/Ranking.jsx';
import Publish from './pages/Publish.jsx';
import Profile from './pages/Profile.jsx';
import Forum from './pages/Forum.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route path="/" element={<Home />} />
          <Route path="/discover" element={<Discover />} />
          <Route path="/book/:id" element={<BookDetail />} />
          <Route path="/book/:id/read/:chapter" element={<Reader />} />
          <Route path="/library" element={<Library />} />
          <Route path="/ranking" element={<Ranking />} />
          <Route path="/publish" element={<Publish />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/forum" element={<Forum />} />
          <Route path="/admin" element={<AdminDashboard />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
