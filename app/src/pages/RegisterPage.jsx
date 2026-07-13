function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">Página Cadastro</h1>
        <p className="text-gray-600 mb-6">Esta é a rota de cadastro</p>
        <div className="space-x-4">
          <a href="/Login" className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600">Login</a>
          <a href="/" className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600">Home</a>
        </div>
      </div>
    </div>
  );
}

export default RegisterPage;
