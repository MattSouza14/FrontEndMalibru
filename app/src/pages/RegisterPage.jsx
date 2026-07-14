import { Link } from "react-router-dom";

function Field({ label, children }) {
  return (
    <label className="block group space-y-1.5">
      <span className="text-[10px] uppercase tracking-widest text-gray-500 font-bold px-0.5 group-focus-within:text-green-700 transition-colors">
        {label}
      </span>
      {children}
    </label>
  );
}

function RegisterPage() {
  return (
      <div className="min-h-screen bg-gray-100">
        <nav className="border-b border-gray-200 bg-white px-6 py-3">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <Link to="/Login" className="flex items-center gap-2">
              <div className="size-8 bg-green-700 flex items-center justify-center">
                <span className="text-white font-serif font-bold italic">
                  M</span>
              </div>
              <span className="font-serif font-bold text-lg tracking-tight uppercase">
                Malibru <span className="text-green-500"> Portal</span>
              </span>
            </Link>
            <Link to="/Login">
              <span className="text-xs font-bold uppercase tracking-widest text-gray-500 hover:text-green-700">
                Já tenho conta
              </span>
            </Link>
          </div>
        </nav>
        <main className="max-w-2xl mx-auto p-6 md:p-12">
          <div>
            <p className="text-[10px] uppercase tracking-[0.25em] font-bold text-gray-500 mb-3">
               Novo Cadastro</p>
            <h1 className="font-serif italic text-4xl text-green-700">Criar sua conta</h1>
            <p className="mt-2 text-sm text-gray-600 max-w-md">
               Preencha os dados abaixo. Após validação, você terá acesso ao painel.
            </p>
          </div>
          <form action="" className="mt-10 bg-white border border-gray-200 p-6 md:p-8 shadow-sm space-y-5">
             <div className="grid md:grid-cols-2 gap-5">
            <Field label="E-mail corporativo">
              <input
                type="email"
                required
                className="w-full px-4 py-3.5 bg-white border border-gray-300 focus:border-green-700 focus:ring-0 focus:outline-none transition-all text-gray-900 text-sm font-light placeholder:text-gray-400"
                placeholder="voce@empresa.com.br"
              />
            </Field> 
            <Field label="Senha">
              <input
                type="password"
                required
                className="w-full px-4 py-3.5 bg-white border border-gray-300 focus:border-green-700 focus:ring-0 focus:outline-none transition-all text-gray-900 text-sm placeholder:text-gray-400"
                placeholder="Mínimo 6 caracteres"
              />
            </Field> 
            <Field label="CPF"> 
              <input
                type="text"
                required
                className="w-full px-4 py-3.5 bg-white border border-gray-300 focus:border-green-700 focus:ring-0 focus:outline-none transition-all text-gray-900 text-sm font-mono placeholder:text-gray-400"
                placeholder="000.000.000-00"
              />
             </Field> 

          </div>

          <div className="pt-4 border-t border-gray-200">
            <button
              type="submit"
              className="w-full md:w-auto bg-green-700 text-white py-3 px-8 text-xs font-bold uppercase tracking-[0.2em] hover:bg-green-800 transition-colors inline-flex items-center justify-center gap-2 cursor-pointer"
            >
              Criar conta
            </button>
            <p className="mt-4 text-[11px] text-gray-500">
              Ao criar sua conta você aceita os termos de uso do Malibru Portal.
            </p>
          </div>
          </form> 
        </main>
      </div>


    // <div className="min-h-screen flex items-center justify-center bg-gray-100">
    //   <div className="text-center">
    //     <h1 className="text-4xl font-bold text-gray-800 mb-4">Página Cadastro</h1>
    //     <p className="text-gray-600 mb-6">Esta é a rota de cadastro</p>
    //     <div className="space-x-4">
    //       <a href="/Login" className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600">Login</a>
    //       <a href="/" className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600">Home</a>
    //     </div>
    //   </div>
    // </div>
  );
}

export default RegisterPage;
