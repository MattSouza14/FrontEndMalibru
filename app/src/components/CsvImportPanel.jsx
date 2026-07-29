import { useRef, useState } from 'react';

const DEFAULT_CSV_TEMPLATE = `nome,patrimonio,descricao
Notebook Dell,12345,Core i5 16GB
Monitor LG,12346,Tela 24 polegadas
Impressora HP,,Multifuncional sala 2
`;

const DEFAULT_ERROR_COLUMNS = [
  { key: 'linha', label: 'Linha' },
  { key: 'nome', label: 'Nome' },
  { key: 'patrimonio', label: 'Patrimônio' },
  { key: 'motivo', label: 'Motivo' },
];

function Loader2() {
  return (
    <svg className="size-4 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <circle className="opacity-25" cx="12" cy="12" r="10" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

function downloadTemplate(filename, content) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function formatCellValue(value) {
  if (value === null || value === undefined || value === '') return '—';
  return String(value);
}

export default function CsvImportPanel({
  title = 'Importar CSV',
  description,
  templateFilename = 'modelo-importacao.csv',
  templateContent = DEFAULT_CSV_TEMPLATE,
  previewContent,
  errorColumns = DEFAULT_ERROR_COLUMNS,
  importing = false,
  result = null,
  onImport,
}) {
  const inputRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const preview = previewContent ?? templateContent.trim();

  function handleFileChange(event) {
    const file = event.target.files?.[0] ?? null;
    setSelectedFile(file);
  }

  function handleSubmit(event) {
    event.preventDefault();
    if (!selectedFile || importing) return;
    onImport(selectedFile);
  }

  function clearSelection() {
    setSelectedFile(null);
    if (inputRef.current) inputRef.current.value = '';
  }

  return (
    <section className="bg-white border border-gray-200 p-6 space-y-5">
      <div>
        <h2 className="font-serif text-xl text-green-700">{title}</h2>
        {description && <p className="text-sm text-gray-600 mt-2">{description}</p>}
      </div>

      <div className="bg-gray-50 border border-gray-200 p-4 space-y-3">
        <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">
          Formato esperado
        </p>
        <p className="text-sm text-gray-600">
          Arquivo <strong>.csv</strong> UTF-8 com cabeçalho na primeira linha. Separador{' '}
          <code className="text-xs bg-white px-1 py-0.5 border border-gray-200">,</code> ou{' '}
          <code className="text-xs bg-white px-1 py-0.5 border border-gray-200">;</code> (Excel BR).
        </p>
        <pre className="text-xs bg-white border border-gray-200 p-3 overflow-x-auto text-gray-700">
          {preview}
        </pre>
        <button
          type="button"
          onClick={() => downloadTemplate(templateFilename, templateContent)}
          className="text-xs font-bold uppercase tracking-widest text-green-700 hover:text-green-800"
        >
          Baixar modelo CSV →
        </button>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row sm:items-end gap-4">
        <label className="block space-y-1.5 flex-1">
          <span className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">
            Arquivo
          </span>
          <input
            ref={inputRef}
            type="file"
            accept=".csv,text/csv"
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:border-0 file:text-xs file:font-bold file:uppercase file:tracking-widest file:bg-green-700 file:text-white hover:file:bg-green-800"
          />
        </label>

        <div className="flex gap-3">
          {selectedFile && (
            <button
              type="button"
              onClick={clearSelection}
              disabled={importing}
              className="px-4 py-3 text-xs font-bold uppercase tracking-widest text-gray-600 hover:text-gray-900 disabled:opacity-50"
            >
              Limpar
            </button>
          )}
          <button
            type="submit"
            disabled={!selectedFile || importing}
            className="bg-green-700 hover:bg-green-800 text-white px-6 py-3 text-xs font-bold uppercase tracking-widest inline-flex items-center gap-2 disabled:opacity-50"
          >
            {importing && <Loader2 />}
            Importar
          </button>
        </div>
      </form>

      {result && (
        <div className="space-y-4 pt-2 border-t border-gray-200">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="border border-gray-200 p-4">
              <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">
                Total de linhas
              </p>
              <p className="text-2xl font-serif text-green-700 mt-1">{result.totalLinhas ?? 0}</p>
            </div>
            <div className="border border-gray-200 p-4">
              <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">
                Importados
              </p>
              <p className="text-2xl font-serif text-green-700 mt-1">{result.importados ?? 0}</p>
            </div>
            <div className="border border-gray-200 p-4">
              <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">
                Ignorados
              </p>
              <p className="text-2xl font-serif text-amber-600 mt-1">{result.ignorados ?? 0}</p>
            </div>
          </div>

          {Array.isArray(result.erros) && result.erros.length > 0 && (
            <div className="overflow-x-auto border border-gray-200">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-left text-[10px] uppercase tracking-widest text-gray-500">
                    {errorColumns.map((column) => (
                      <th key={column.key} className="px-4 py-3 font-bold">
                        {column.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {result.erros.map((item, index) => (
                    <tr key={`${item.linha}-${index}`} className="border-b border-gray-100">
                      {errorColumns.map((column) => (
                        <td
                          key={column.key}
                          className={`px-4 py-3 ${
                            column.key === 'motivo' ? 'text-red-700' : 'text-gray-600'
                          }`}
                        >
                          {formatCellValue(item[column.key])}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
