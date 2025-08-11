import { Route, Routes } from 'react-router-dom';
import Home from './pages/Home';
import LayoutContainer from './pages/LayoutContainer';
import Check from './pages/Check';
import Favorite from './pages/Favorite';


const App = () => {
  return (
    <Routes>
      <Route path="/" element={<LayoutContainer />} >
        {/* 기본 페이지를 index로 설정! */}
        <Route index element={<Check />} /> 
        <Route path="/search" element={<Home />} />
        <Route path="/favorite" element={<Favorite />} />
        <Route path="/check" element={<Check />} />
      </Route>
    </Routes>
  );
};

export default App;