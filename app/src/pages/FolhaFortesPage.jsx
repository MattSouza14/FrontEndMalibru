import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AlertBanner from '../components/ui/AlertBanner';
import PageContainer from '../components/ui/PageContainer';
import PageHeader from '../components/ui/PageHeader';
import SectionCard from '../components/ui/SectionCard';
import {
  analisarFolhaFortes,
  dividirFolhaFortes,
  extrairFolhaFortes,
} from '../services/rhFolhaService';
import { getApiErrorMessage, isUnauthorized } from '../utils/apiErrors';
import { downloadBlob } from '../utils/download';

const ACCEPTED_FILE = '.txt,text/plain';

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

function parseCpfsInput(text) {
  return text
    .split(/[\n,;]+/)
    .map((value) => value.trim())
    .filter(Boolean);
}

function formatFileSize(bytes) {
  if (!bytes && bytes !== 0) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function FolhaFortesPage() {
  const { getToken, logout } = useAuth();
  const navigate = useNavigate();

  const [file, setFile] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [mode, setMode] = useState('dividir');
  const [cpfsPorParte, setCpfsPorParte] = useState('10');
  const [incluirLinhasSemCpf, setIncluirLinhasSemCpf] = useState(false);
  const [cpfsText, setCpfsText] = useState('');
  const [formatoSaida, setFormatoSaida] = useState('UNICO');

  const [analyzing, setAnalyzing] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  function handleAuthFailure(err) {
    if (isUnauthorized(err)) {
      logout();
      navigate('/Login', { replace: true });
    }
  }

  async function runAnalysis(selectedFile) {
    const token = getToken();
    if (!selectedFile || !token) return;

    setAnalyzing(true);
    setError('');
    setSuccess('');
    setAnalysis(null);

    try {
      const result = await analisarFolhaFortes(token, selectedFile);
      setAnalysis(result);

      if (result.sugestoesDivisao?.length) {
        setCpfsPorParte(String(result.sugestoesDivisao[0].cpfsPorParte));
      }
    } catch (err) {
      handleAuthFailure(err);
      setError(getApiErrorMessage(err, 'Não foi possível analisar o arquivo.'));
    } finally {
      setAnalyzing(false);
    }
  }

  function handleFileChange(event) {
    const selectedFile = event.target.files?.[0] ?? null;
    setFile(selectedFile);
    setAnalysis(null);
    setError('');
    setSuccess('');

    if (selectedFile) {
      runAnalysis(selectedFile);
    }
  }

  async function handleDividir(event) {
    event.preventDefault();
    const token = getToken();
    if (!file || !token) return;

    const parsed = Number(cpfsPorParte);
    if (!Number.isFinite(parsed) || parsed < 1) {
      setError('Informe quantos CPFs por parte (mínimo 1).');
      return;
    }

    setProcessing(true);
    setError('');
    setSuccess('');

    try {
      const blob = await dividirFolhaFortes(token, file, parsed, incluirLinhasSemCpf);
      downloadBlob(blob, 'folha_dividida.zip');
      setSuccess('Arquivo dividido com sucesso. O download do ZIP foi iniciado.');
    } catch (err) {
      handleAuthFailure(err);
      setError(getApiErrorMessage(err, 'Não foi possível dividir o arquivo.'));
    } finally {
      setProcessing(false);
    }
  }

  async function handleExtrair(event) {
    event.preventDefault();
    const token = getToken();
    if (!file || !token) return;

    const cpfs = parseCpfsInput(cpfsText);
    if (!cpfs.length) {
      setError('Informe ao menos um CPF para extrair.');
      return;
    }

    setProcessing(true);
    setError('');
    setSuccess('');

    try {
      const blob = await extrairFolhaFortes(token, file, cpfs, formatoSaida);
      downloadBlob(blob, 'folha_extraida.zip');
      setSuccess('Extração concluída. O download do ZIP foi iniciado (consulte resumo.json dentro do arquivo).');
    } catch (err) {
      handleAuthFailure(err);
      setError(getApiErrorMessage(err, 'Não foi possível extrair os CPFs.'));
    } finally {
      setProcessing(false);
    }
  }

  return (
    <PageContainer>
      <PageHeader
        title="Folha Fortes"
        subtitle="Analise, divida ou extraia eventos de arquivos .txt exportados pelo Fortes."
      />

      {error && (
        <AlertBanner variant="error" className="mb-6">
          {error}
        </AlertBanner>
      )}

      {success && (
        <AlertBanner variant="success" className="mb-6">
          {success}
        </AlertBanner>
      )}

      <SectionCard
        title="Arquivo Fortes"
        subtitle="Selecione um arquivo .txt (encoding ISO-8859-1). A análise é feita automaticamente."
      >
        <div className="space-y-4">
          <label className="block">
            <span className="text-sm font-medium text-gray-700">Arquivo .txt</span>
            <input
              type="file"
              accept={ACCEPTED_FILE}
              onChange={handleFileChange}
              className="mt-1.5 block w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary/10 file:text-primary hover:file:bg-primary/15"
            />
          </label>

          {file && (
            <p className="text-sm text-gray-500">
              <span className="font-medium text-gray-700">{file.name}</span>
              {' · '}
              {formatFileSize(file.size)}
            </p>
          )}

          {analyzing && (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Loader2 />
              Analisando arquivo...
            </div>
          )}
        </div>
      </SectionCard>

      {analysis && (
        <SectionCard
          title="Pré-visualização"
          subtitle="Resumo do arquivo antes de dividir ou extrair."
          className="mt-6"
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="rounded-lg bg-gray-50 px-4 py-3">
              <p className="text-xs uppercase tracking-wider text-gray-500">Linhas</p>
              <p className="text-2xl font-semibold text-gray-900 mt-1">{analysis.totalLinhas}</p>
            </div>
            <div className="rounded-lg bg-gray-50 px-4 py-3">
              <p className="text-xs uppercase tracking-wider text-gray-500">CPFs distintos</p>
              <p className="text-2xl font-semibold text-gray-900 mt-1">{analysis.totalCpfs}</p>
            </div>
            <div className="rounded-lg bg-gray-50 px-4 py-3">
              <p className="text-xs uppercase tracking-wider text-gray-500">Linhas sem CPF</p>
              <p className="text-2xl font-semibold text-gray-900 mt-1">{analysis.linhasSemCpf}</p>
            </div>
          </div>

          {analysis.sugestoesDivisao?.length > 0 && (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Sugestões de divisão</p>
              <div className="overflow-x-auto rounded-lg border border-gray-100">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50 text-left text-xs uppercase tracking-wider text-gray-500">
                    <tr>
                      <th className="px-4 py-2.5 font-medium">CPFs por parte</th>
                      <th className="px-4 py-2.5 font-medium">Total de partes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {analysis.sugestoesDivisao.map((item) => (
                      <tr key={item.cpfsPorParte}>
                        <td className="px-4 py-2.5 text-gray-900">{item.cpfsPorParte}</td>
                        <td className="px-4 py-2.5 text-gray-600">{item.totalPartes}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </SectionCard>
      )}

      {file && analysis && (
        <SectionCard
          title="Processamento"
          subtitle="Escolha dividir o arquivo em partes ou extrair CPFs específicos."
          className="mt-6"
        >
          <div className="flex flex-wrap gap-2 mb-6">
            <button
              type="button"
              onClick={() => setMode('dividir')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                mode === 'dividir'
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Dividir
            </button>
            <button
              type="button"
              onClick={() => setMode('extrair')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                mode === 'extrair'
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Extrair CPFs
            </button>
          </div>

          {mode === 'dividir' ? (
            <form onSubmit={handleDividir} className="space-y-4 max-w-md">
              <label className="block">
                <span className="text-sm font-medium text-gray-700">CPFs por parte</span>
                <input
                  type="number"
                  min="1"
                  value={cpfsPorParte}
                  onChange={(event) => setCpfsPorParte(event.target.value)}
                  className="mt-1.5 block w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </label>

              {analysis.sugestoesDivisao?.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {analysis.sugestoesDivisao.map((item) => (
                    <button
                      key={item.cpfsPorParte}
                      type="button"
                      onClick={() => setCpfsPorParte(String(item.cpfsPorParte))}
                      className="px-3 py-1.5 rounded-md text-xs font-medium bg-blue-50 text-blue-700 hover:bg-blue-100"
                    >
                      {item.cpfsPorParte} CPFs → {item.totalPartes} partes
                    </button>
                  ))}
                </div>
              )}

              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={incluirLinhasSemCpf}
                  onChange={(event) => setIncluirLinhasSemCpf(event.target.checked)}
                  className="mt-0.5 rounded border-gray-300 text-primary focus:ring-primary/20"
                />
                <span className="text-sm text-gray-600">
                  Incluir linhas sem CPF identificável na parte 1
                </span>
              </label>

              <button
                type="submit"
                disabled={processing || analyzing}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {processing ? <Loader2 /> : null}
                Dividir e baixar ZIP
              </button>
            </form>
          ) : (
            <form onSubmit={handleExtrair} className="space-y-4 max-w-xl">
              <label className="block">
                <span className="text-sm font-medium text-gray-700">CPFs</span>
                <span className="block text-xs text-gray-500 mt-0.5">
                  Um por linha ou separados por vírgula. Aceita máscara (ex.: 246.067.228-40).
                </span>
                <textarea
                  rows={6}
                  value={cpfsText}
                  onChange={(event) => setCpfsText(event.target.value)}
                  placeholder={'24606722840\n315.070.241-27'}
                  className="mt-1.5 block w-full rounded-lg border border-gray-200 px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </label>

              <label className="block">
                <span className="text-sm font-medium text-gray-700">Formato de saída</span>
                <select
                  value={formatoSaida}
                  onChange={(event) => setFormatoSaida(event.target.value)}
                  className="mt-1.5 block w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                >
                  <option value="UNICO">Arquivo único (folha_extraida.txt)</option>
                  <option value="POR_CPF">Um arquivo por CPF (folha_{'{cpf}'}.txt)</option>
                </select>
              </label>

              <button
                type="submit"
                disabled={processing || analyzing}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {processing ? <Loader2 /> : null}
                Extrair e baixar ZIP
              </button>
            </form>
          )}
        </SectionCard>
      )}
    </PageContainer>
  );
}
