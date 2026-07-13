import { Link } from 'react-router-dom';

export default function Header() {
  return (
    <header className="bg-blue-600 text-white shadow-lg">
      <div className="container mx-auto px-4 py-4">
        <nav className="flex items-center justify-between">
          <Link to="/" className="text-xl font-bold">Meu App</Link>
          <div className="space-x-4">
            <Link to="/" className="hover:text-blue-200">Home</Link>
            <Link to="/Login" className="hover:text-blue-200">Login</Link>
            <Link to="/Register" className="hover:text-blue-200">Cadastrar</Link>
          </div>
        </nav>
      </div>
    </header>
  );
}
