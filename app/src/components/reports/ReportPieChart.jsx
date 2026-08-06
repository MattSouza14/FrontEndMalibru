import { resolveChartFill } from '../../utils/reportChartColors';

const CX = 80;
const CY = 80;
const OUTER_R = 68;
const INNER_R = 42;

function polar(cx, cy, radius, angleDeg) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: cx + radius * Math.cos(rad),
    y: cy + radius * Math.sin(rad),
  };
}

function donutSlicePath(startAngle, endAngle) {
  const span = endAngle - startAngle;

  if (span >= 359.99) {
    return [
      `M ${CX} ${CY - OUTER_R}`,
      `A ${OUTER_R} ${OUTER_R} 0 1 1 ${CX - 0.01} ${CY - OUTER_R}`,
      `L ${CX - 0.01} ${CY - INNER_R}`,
      `A ${INNER_R} ${INNER_R} 0 1 0 ${CX} ${CY - INNER_R}`,
      'Z',
    ].join(' ');
  }

  const largeArc = span > 180 ? 1 : 0;
  const outerStart = polar(CX, CY, OUTER_R, startAngle);
  const outerEnd = polar(CX, CY, OUTER_R, endAngle);
  const innerStart = polar(CX, CY, INNER_R, endAngle);
  const innerEnd = polar(CX, CY, INNER_R, startAngle);

  return [
    `M ${outerStart.x} ${outerStart.y}`,
    `A ${OUTER_R} ${OUTER_R} 0 ${largeArc} 1 ${outerEnd.x} ${outerEnd.y}`,
    `L ${innerStart.x} ${innerStart.y}`,
    `A ${INNER_R} ${INNER_R} 0 ${largeArc} 0 ${innerEnd.x} ${innerEnd.y}`,
    'Z',
  ].join(' ');
}

function buildSlices(items) {
  const filtered = items.filter((item) => item.value > 0);
  const total = filtered.reduce((sum, item) => sum + item.value, 0);
  if (total === 0) return { total: 0, slices: [] };

  let angle = 0;
  const slices = filtered.map((item, index) => {
    const sliceAngle = (item.value / total) * 360;
    const startAngle = angle;
    const endAngle = angle + sliceAngle;
    angle = endAngle;

    return {
      ...item,
      itemKey: item.key ?? item.label,
      fill: resolveChartFill(item, index),
      startAngle,
      endAngle,
      percent: Math.round((item.value / total) * 100),
      path: donutSlicePath(startAngle, endAngle),
    };
  });

  return { total, slices };
}

function LegendRow({ slice, isSelected, isInteractive, onItemClick, valueSuffix }) {
  const content = (
    <>
      <span
        className="size-2.5 rounded-full shrink-0 mt-1.5"
        style={{ backgroundColor: slice.fill }}
      />
      <span
        className={`flex-1 min-w-0 leading-snug break-words ${
          isSelected ? 'text-primary font-medium' : 'text-gray-700'
        }`}
      >
        {slice.label}
      </span>
      <span className="font-semibold text-slate-900 tabular-nums shrink-0 whitespace-nowrap">
        {slice.value}
        {valueSuffix}
        <span className="text-gray-400 font-normal ml-1">({slice.percent}%)</span>
      </span>
    </>
  );

  if (isInteractive) {
    return (
      <button
        type="button"
        onClick={() => onItemClick(slice)}
        className={`w-full flex items-start gap-2 text-sm rounded-lg px-2 py-2 transition-colors hover:bg-gray-50 text-left ${
          isSelected ? 'bg-primary/5 ring-1 ring-primary/20' : ''
        }`}
        aria-pressed={isSelected}
      >
        {content}
      </button>
    );
  }

  return <div className="flex items-start gap-2 text-sm px-2 py-1.5">{content}</div>;
}

export default function ReportPieChart({
  items = [],
  emptyMessage = 'Sem dados.',
  onItemClick,
  selectedKey,
  centerLabel,
  valueSuffix = '',
}) {
  const { total, slices } = buildSlices(items);
  const isInteractive = typeof onItemClick === 'function';

  if (!slices.length) {
    return <p className="text-sm text-gray-500">{emptyMessage}</p>;
  }

  return (
    <div className="w-full min-w-0">
      <div className="flex justify-center">
        <div className="relative shrink-0">
          <svg viewBox="0 0 160 160" className="size-36 sm:size-40" role="img" aria-label="Gráfico de pizza">
            {slices.map((slice) => {
              const isSelected = selectedKey != null && selectedKey === slice.itemKey;

              if (!isInteractive) {
                return (
                  <path
                    key={slice.itemKey}
                    d={slice.path}
                    fill={slice.fill}
                    className={`transition-opacity ${isSelected ? 'opacity-100' : 'opacity-90'}`}
                    stroke="#ffffff"
                    strokeWidth="1.5"
                  />
                );
              }

              return (
                <g key={slice.itemKey}>
                  <path
                    d={slice.path}
                    fill="transparent"
                    className="cursor-pointer"
                    onClick={() => onItemClick(slice)}
                  />
                  <path
                    d={slice.path}
                    fill={slice.fill}
                    className={`pointer-events-none transition-opacity ${
                      isSelected ? 'opacity-100' : 'opacity-90'
                    }`}
                    stroke="#ffffff"
                    strokeWidth={isSelected ? 2.5 : 1.5}
                  />
                </g>
              );
            })}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none px-4 text-center">
            <span className="text-xl font-bold text-slate-900 tabular-nums leading-none">{total}</span>
            {centerLabel && (
              <span className="text-[10px] uppercase tracking-wider text-gray-500 mt-1 leading-tight">
                {centerLabel}
              </span>
            )}
          </div>
        </div>
      </div>

      <ul className="mt-4 space-y-1 w-full">
        {slices.map((slice) => {
          const isSelected = selectedKey != null && selectedKey === slice.itemKey;

          return (
            <li key={slice.itemKey}>
              <LegendRow
                slice={slice}
                isSelected={isSelected}
                isInteractive={isInteractive}
                onItemClick={onItemClick}
                valueSuffix={valueSuffix}
              />
            </li>
          );
        })}
      </ul>
    </div>
  );
}
