// Linhas oficiais simplificadas de uma quadra de basquete (28 x 15 m, escala 1 m = 20).
function CourtLines() {
  return (
    <>
      <rect x="0" y="0" width="560" height="300" rx="2" />
      <path d="M280 0v300" />
      <circle cx="280" cy="150" r="36" />
      <circle cx="280" cy="150" r="12" />
      {/* Garrafões pintados */}
      <rect className="pintado" x="0" y="100" width="116" height="100" />
      <rect className="pintado" x="444" y="100" width="116" height="100" />
      <rect x="0" y="100" width="116" height="100" />
      <rect x="444" y="100" width="116" height="100" />
      <circle cx="116" cy="150" r="36" />
      <circle cx="444" cy="150" r="36" />
      {/* Linha de 3 pontos */}
      <path d="M0 18h30a135 135 0 0 1 0 264H0" />
      <path d="M560 18h-30a135 135 0 0 0 0 264h30" />
      {/* Aro e tabela */}
      <path d="M24 130v40M536 130v40" />
      <circle cx="31" cy="150" r="5" />
      <circle cx="529" cy="150" r="5" />
    </>
  );
}

// Deitada no computador e em pé no celular, sempre ocupando a tela inteira.
export function CourtSvg({ vertical = false }: { vertical?: boolean }) {
  return (
    <svg
      viewBox={vertical ? '-20 -20 340 600' : '-20 -20 600 340'}
      preserveAspectRatio="xMidYMid slice"
      width="100%"
      height="100%"
    >
      <g transform={vertical ? 'translate(300 0) rotate(90)' : undefined}>
        <CourtLines />
      </g>
    </svg>
  );
}
