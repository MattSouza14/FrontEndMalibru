import { formatEmpresaLabel } from '../utils/equipment';
import useEmpresas from '../hooks/useEmpresas';

export default function EmpresaSelect({
  value,
  onChange,
  required = false,
  disabled = false,
  error,
  placeholder = 'Selecione a empresa',
  className = 'form-input',
}) {
  const { empresas, loading } = useEmpresas();

  return (
    <div>
      <select
        value={value ?? ''}
        onChange={(event) => onChange(event.target.value)}
        required={required}
        disabled={disabled || loading}
        className={className}
      >
        <option value="">{loading ? 'Carregando empresas...' : placeholder}</option>
        {empresas.map((empresa) => (
          <option key={empresa} value={empresa}>
            {formatEmpresaLabel(empresa)}
          </option>
        ))}
      </select>
      {error && <p className="text-xs text-ws-red mt-1">{error}</p>}
    </div>
  );
}
