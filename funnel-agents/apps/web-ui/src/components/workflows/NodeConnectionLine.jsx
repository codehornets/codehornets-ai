
export default function NodeConnectionLine({ from, to, onDelete }) {
  const midX = (from.x + to.x) / 2;
  const midY = (from.y + to.y) / 2;

  const path = `M ${from.x + 96} ${from.y + 80} C ${from.x + 96} ${from.y + 120}, ${to.x + 96} ${to.y - 40}, ${to.x + 96} ${to.y}`;

  return (
    <g className="pointer-events-auto cursor-pointer group" onClick={onDelete}>
      <path
        d={path}
        fill="none"
        stroke="rgba(59, 130, 246, 0.5)"
        strokeWidth="2"
        className="group-hover:stroke-red-500 transition-colors"
      />
      <circle
        cx={midX + 96}
        cy={midY + 40}
        r="12"
        fill="rgba(15, 23, 42, 0.9)"
        className="group-hover:fill-red-500/20"
      />
      <text
        x={midX + 96}
        y={midY + 44}
        textAnchor="middle"
        className="text-[10px] fill-slate-400 group-hover:fill-red-400 select-none"
      >
        ✕
      </text>
    </g>
  );
}