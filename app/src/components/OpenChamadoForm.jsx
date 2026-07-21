import { useState } from 'react';
import { FERRAMENTAS_REMOTAS } from '../utils/chamadoStatus';
import {
  formatBrazilianMobileInput,
  normalizeBrazilianMobile,
  validateOpenChamadoForm,
} from '../utils/validation';

const EMPTY_FORM = {
  assunto: '',
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
  return <p className="text-xs text-red-600">{message}</p>;
}

export default function OpenChamadoForm({ onSubmit, onCancel, loading, error }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [fieldErrors, setFieldErrors] = useState({});

  function updateField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setFieldErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  async function handleSubmit(e) {
    e.preventDefault();

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
      descricao,
      telefoneContato,
      ferramentaRemota: form.ferramentaRemota,
      codigoAcessoRemoto,
    });

    if (success) {
      setForm(EMPTY_FORM);
      setFieldErrors({});
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-gray-200 p-6 space-y-4">
      <h2 className="font-serif text-xl text-green-700">Abrir chamado de suporte</h2>
      <p className="text-xs text-gray-500">
        O e-mail do chamado será o cadastrado no seu perfil. Certifique-se de que está correto antes
        de abrir.
      </p>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>
      )}

      <label className="block space-y-1.5">
        <span className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">
          Assunto
        </span>
        <input
          type="text"
          maxLength={200}
          value={form.assunto}
          onChange={(e) => updateField('assunto', e.target.value)}
          className="w-full px-4 py-3 bg-white border border-gray-300 focus:border-green-700 focus:outline-none text-sm"
          placeholder="Ex.: Computador não liga"
        />
        <FieldError message={fieldErrors.assunto} />
      </label>

      <label className="block space-y-1.5">
        <span className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">
          Descrição
        </span>
        <textarea
          rows={4}
          value={form.descricao}
          onChange={(e) => updateField('descricao', e.target.value)}
          className="w-full px-4 py-3 bg-white border border-gray-300 focus:border-green-700 focus:outline-none text-sm resize-y"
          placeholder="Descreva o problema com detalhes..."
        />
        <FieldError message={fieldErrors.descricao} />
      </label>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <label className="block space-y-1.5">
          <span className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">
            Telefone de contato
          </span>
          <input
            type="tel"
            inputMode="numeric"
            maxLength={16}
            value={form.telefoneContato}
            onChange={(e) => updateField('telefoneContato', formatBrazilianMobileInput(e.target.value))}
            className="w-full px-4 py-3 bg-white border border-gray-300 focus:border-green-700 focus:outline-none text-sm"
            placeholder="(11) 98765-4321"
          />
          <p className="text-[11px] text-gray-400">Celular BR: DDD + 9 + 8 dígitos.</p>
          <FieldError message={fieldErrors.telefoneContato} />
        </label>

        <label className="block space-y-1.5">
          <span className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">
            Ferramenta remota
          </span>
          <select
            value={form.ferramentaRemota}
            onChange={(e) => updateField('ferramentaRemota', e.target.value)}
            className="w-full px-4 py-3 bg-white border border-gray-300 focus:border-green-700 focus:outline-none text-sm"
          >
            {FERRAMENTAS_REMOTAS.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
        </label>

        <label className="block space-y-1.5">
          <span className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">
            Código de acesso remoto
          </span>
          <input
            type="text"
            inputMode="numeric"
            maxLength={100}
            value={form.codigoAcessoRemoto}
            onChange={(e) => updateField('codigoAcessoRemoto', e.target.value.replace(/\D/g, ''))}
            className="w-full px-4 py-3 bg-white border border-gray-300 focus:border-green-700 focus:outline-none text-sm"
            placeholder="Somente números"
          />
          <p className="text-[11px] text-gray-400">ID AnyDesk, TeamViewer ou RustDesk.</p>
          <FieldError message={fieldErrors.codigoAcessoRemoto} />
        </label>
      </div>

      <div className="flex gap-3 justify-end">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-3 text-xs font-bold uppercase tracking-widest text-gray-600 hover:text-gray-900"
          >
            Cancelar
          </button>
        )}
        <button
          type="submit"
          disabled={loading}
          className="bg-green-700 hover:bg-green-800 text-white px-6 py-3 text-xs font-bold uppercase tracking-widest inline-flex items-center gap-2 disabled:opacity-50"
        >
          {loading && <Loader2 />}
          Abrir chamado
        </button>
      </div>
    </form>
  );
}
