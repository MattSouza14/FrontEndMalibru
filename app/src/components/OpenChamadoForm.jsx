import { useState } from 'react';
import AlertBanner from './ui/AlertBanner';
import SectionCard from './ui/SectionCard';
import { FERRAMENTAS_REMOTAS } from '../utils/chamadoStatus';
import {
  formatBrazilianMobileInput,
  normalizeBrazilianMobile,
  validateOpenChamadoForm,
} from '../utils/validation';

const EMPTY_FORM = {
  assunto: '',
  categoria: 'Outros',
  prioridade: 'BAIXA',
  descricao: '',
  telefoneContato: '',
  ferramentaRemota: 'ANYDESK',
  codigoAcessoRemoto: '',
};

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

function FieldError({ message }) {
  if (!message) return null;
  return <p className="text-xs text-ws-red">{message}</p>;
}

export default function OpenChamadoForm({ onSubmit, onCancel, loading, error }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [arquivos, setArquivos] = useState([]);
  const [fileError, setFileError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});

  function updateField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setFieldErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (fileError) return;
    const errors = validateOpenChamadoForm(form);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    const assunto = form.assunto.trim();
    const descricao = form.descricao.trim();
    const telefoneContato = normalizeBrazilianMobile(form.telefoneContato);
    const codigoAcessoRemoto = form.codigoAcessoRemoto.trim();

    const success = await onSubmit({
      assunto,
      categoria: form.categoria,
      prioridade: form.prioridade,
      arquivos,
      descricao,
      telefoneContato,
      ferramentaRemota: form.ferramentaRemota,
      codigoAcessoRemoto,
    });

    if (success) {
      setForm(EMPTY_FORM);
      setArquivos([]);
      setFieldErrors({});
    }
  }

  return (
    <SectionCard
      title="Abrir chamado de suporte"
      subtitle="Descreva o problema e seu impacto no trabalho. O ticket usará a empresa do seu perfil."
    >
      <form onSubmit={handleSubmit} className="space-y-4 -mt-2 lg:pr-72 relative">
        {error && <AlertBanner type="error">{error}</AlertBanner>}

        <aside className="rounded-xl border border-primary/20 bg-primary/10 p-4 text-sm text-ws-secondary lg:absolute lg:right-0 lg:top-0 lg:w-64">
          <strong className="text-ws-bright">Como funciona o SLA</strong>
          <p>Primeiro atendimento: alta em 2h úteis, média em 4h úteis e baixa em 8h úteis.</p>
          <p>Segunda a sexta, 8h às 18h (Brasília). Consulte o manual abaixo.</p>
        </aside>
        <div className="grid sm:grid-cols-2 gap-4">
          <label className="block space-y-1.5"><span className="form-label">Categoria</span>
            <select className="form-input" value={form.categoria} onChange={(e) => updateField('categoria', e.target.value)}>
              {['Hardware', 'Software', 'Acessos', 'Rede', 'Outros'].map(c => <option key={c}>{c}</option>)}
            </select>
          </label>
          <label className="block space-y-1.5"><span className="form-label">Prioridade</span>
            <select className="form-input" value={form.prioridade} onChange={(e) => updateField('prioridade', e.target.value)}>
              <option value="BAIXA">Baixa — dúvidas e solicitações</option><option value="MEDIA">Média — existe alternativa</option><option value="ALTA">Alta — trabalho interrompido</option>
            </select>
          </label>
        </div>
        <label className="block space-y-1.5">
          <span className="form-label">Assunto</span>
          <input
            type="text"
            maxLength={200}
            value={form.assunto}
            onChange={(e) => updateField('assunto', e.target.value)}
            className="form-input"
            placeholder="Ex.: Computador não liga"
          />
          <FieldError message={fieldErrors.assunto} />
        </label>

        <label className="block space-y-1.5">
          <span className="form-label">Descrição</span>
          <textarea
            rows={4}
            value={form.descricao}
            onChange={(e) => updateField('descricao', e.target.value)}
            className="form-input resize-y"
            placeholder="Descreva o problema com detalhes..."
          />
          <FieldError message={fieldErrors.descricao} />
        </label>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <label className="block space-y-1.5">
            <span className="form-label">Telefone de contato</span>
            <input
              type="tel"
              inputMode="numeric"
              maxLength={16}
              value={form.telefoneContato}
              onChange={(e) => updateField('telefoneContato', formatBrazilianMobileInput(e.target.value))}
              className="form-input"
              placeholder="(11) 98765-4321"
            />
            <p className="text-[11px] text-ws-muted">Celular BR: DDD + 9 + 8 dígitos.</p>
            <FieldError message={fieldErrors.telefoneContato} />
          </label>

          <label className="block space-y-1.5">
            <span className="form-label">Ferramenta remota</span>
            <select
              value={form.ferramentaRemota}
              onChange={(e) => updateField('ferramentaRemota', e.target.value)}
              className="form-input"
            >
              {FERRAMENTAS_REMOTAS.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </select>
          </label>

          <label className="block space-y-1.5">
            <span className="form-label">Código de acesso remoto</span>
            <input
              type="text"
              inputMode="numeric"
              maxLength={100}
              value={form.codigoAcessoRemoto}
              onChange={(e) => updateField('codigoAcessoRemoto', e.target.value.replace(/\D/g, ''))}
              className="form-input"
              placeholder="Somente números"
            />
            <p className="text-[11px] text-ws-muted">ID AnyDesk, TeamViewer ou RustDesk.</p>
            <FieldError message={fieldErrors.codigoAcessoRemoto} />
          </label>
        </div>

        <div className="rounded-xl border border-dashed border-ws-border p-4 space-y-2">
          <label className="block space-y-2"><span className="form-label">Adicionar imagens</span>
            <p className="text-xs text-ws-muted">PNG, JPEG ou GIF. Até 5 arquivos, somando 25 MB; até 16 megapixels por imagem.</p>
            <input type="file" multiple accept="image/png,image/jpeg,image/gif" disabled={loading} onChange={(e) => {
              const files = Array.from(e.target.files || []);
              const invalid = files.length > 5 || files.reduce((sum, f) => sum + f.size, 0) > 25 * 1024 * 1024 || files.some(f => !['image/png', 'image/jpeg', 'image/gif'].includes(f.type));
              setFileError(invalid ? 'Selecione até 5 imagens PNG, JPEG ou GIF, somando no máximo 25 MB.' : null);
              setArquivos(invalid ? [] : files);
            }} className="text-sm max-w-full" />
          </label>
          {fileError && <AlertBanner type="error">{fileError}</AlertBanner>}
          <ul className="text-xs space-y-1">{arquivos.map((f, i) => <li key={i} className="flex justify-between gap-2"><span>{f.name} ({(f.size / 1024).toFixed(0)} KB)</span><button type="button" disabled={loading} onClick={() => setArquivos(arquivos.filter((_, index) => index !== i))}>Remover</button></li>)}</ul>
        </div>
        <div className="flex gap-3 justify-end pt-2">
          {onCancel && (
            <button type="button" onClick={onCancel} className="btn-cancel">
              Cancelar
            </button>
          )}
          <button
            type="submit"
            disabled={loading}
            className="btn-primary inline-flex items-center gap-2 disabled:opacity-50"
          >
            {loading && <Loader2 />}
            Abrir chamado
          </button>
        </div>
      </form>
    </SectionCard>
  );
}
