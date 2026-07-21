import { getStatusClass, getStatusLabel } from '../utils/chamadoStatus';

export default function ChamadoStatusBadge({ status }) {
  return (
    <span
      className={`inline-flex items-center justify-center min-w-[6.75rem] h-7 shrink-0 text-[10px] font-bold uppercase tracking-normal text-center px-2 ${getStatusClass(status)}`}
    >
      {getStatusLabel(status)}
    </span>
  );
}
