export default function EquipmentsPage() {
  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-4xl">
      <header>
        <p className="text-[10px] uppercase tracking-[0.25em] font-bold text-gray-500 mb-2">
          Administração
        </p>
        <h1 className="font-serif italic text-4xl text-green-700">Equipamentos</h1>
        <p className="text-sm text-gray-600 mt-2">
          Módulo de gestão de equipamentos corporativos.
        </p>
      </header>

      <div className="bg-white border border-gray-200 p-10 text-center">
        <div className="size-16 mx-auto bg-gray-100 border border-gray-200 flex items-center justify-center mb-4">
          <svg className="size-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
        </div>
        <p className="font-serif text-xl text-gray-700">Em breve</p>
        <p className="text-sm text-gray-500 mt-2 max-w-md mx-auto">
          A API de equipamentos ainda não está disponível. Este painel será integrado assim que
          o backend disponibilizar os endpoints de cadastro e gestão.
        </p>
      </div>
    </div>
  );
}
