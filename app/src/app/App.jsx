import ErrorBoundary from '../shared/ui/ErrorBoundary.jsx';
import AppRoutes from './routes/AppRoutes.jsx';
import '../App.css';

function App() {
  return (
    <ErrorBoundary><AppRoutes /></ErrorBoundary>
  )
}

export default App
