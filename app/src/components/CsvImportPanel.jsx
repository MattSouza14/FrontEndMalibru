import { useRef, useState } from 'react';
import KpiCard from './ui/KpiCard';
import SectionCard from './ui/SectionCard';

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
    <SectionCard title={title} subtitle={description}>
      <div className="rounded-lg bg-gray-50 border border-gray-100 p-4 space-y-3 -mt-2">
        <p className="form-label">Formato esperado</p>
        <p className="text-sm text-gray-600">
          Arquivo <strong>.csv</strong> UTF-8 com cabeçalho na primeira linha. Separador{' '}
          <code className="text-xs bg-white px-1.5 py-0.5 rounded border border-gray-200">,</code> ou{' '}
          <code className="text-xs bg-white px-1.5 py-0.5 rounded border border-gray-200">;</code> (Excel BR).
        </p>
        <pre className="text-xs bg-white border border-gray-100 rounded-lg p-3 overflow-x-auto text-gray-700">
          {preview}
        </pre>
        <button
          type="button"
          onClick={() => downloadTemplate(templateFilename, templateContent)}
          className="btn-ghost"
        >
          Baixar modelo CSV →
        </button>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row sm:items-end gap-4 mt-5">
        <label className="block space-y-1.5 flex-1">
          <span className="form-label">Arquivo</span>
          <input
            ref={inputRef}
            type="file"
            accept=".csv,text/csv"
            onChange={handleFileChange}
            className="file-input"
          />
        </label>

        <div className="flex gap-3">
          {selectedFile && (
            <button
              type="button"
              onClick={clearSelection}
              disabled={importing}
              className="btn-cancel disabled:opacity-50"
            >
              Limpar
            </button>
          )}
          <button
            type="submit"
            disabled={!selectedFile || importing}
            className="btn-primary inline-flex items-center gap-2 disabled:opacity-50"
          >
            {importing && <Loader2 />}
            Importar
          </button>
        </div>
      </form>

      {result && (
        <div className="space-y-4 pt-5 mt-5 border-t border-gray-100">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <KpiCard label="Total de linhas" value={result.totalLinhas ?? 0} />
            <KpiCard label="Importados" value={result.importados ?? 0} accent="green" />
            <KpiCard label="Ignorados" value={result.ignorados ?? 0} accent="amber" />
          </div>

          {Array.isArray(result.erros) && result.erros.length > 0 && (
            <div className="overflow-x-auto rounded-lg border border-gray-100">
              <table className="data-table w-full">
                <thead>
                  <tr>
                    {errorColumns.map((column) => (
                      <th key={column.key}>{column.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {result.erros.map((item, index) => (
                    <tr key={`${item.linha}-${index}`}>
                      {errorColumns.map((column) => (
                        <td
                          key={column.key}
                          className={column.key === 'motivo' ? 'text-red-700' : 'text-gray-600'}
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
    </SectionCard>
  );
}
