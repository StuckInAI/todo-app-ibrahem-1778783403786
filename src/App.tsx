import { BrowserRouter, Routes, Route } from 'react-router-dom';
import DesignerPage from '@/pages/DesignerPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<DesignerPage />} />
        <Route path="*" element={<DesignerPage />} />
      </Routes>
    </BrowserRouter>
  );
}
