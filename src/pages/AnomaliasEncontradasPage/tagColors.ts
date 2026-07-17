const TAG_CORES: Record<string, string> = {
  'TSE':                  '#00f0ff',
  'TCU':                  '#ff6a00',
  'Portal Transparência': '#39ff14',
};

export function extrairCategoria(tag: string): string {
  const idx = tag.indexOf('-');
  return idx >= 0 ? tag.slice(idx + 1) : tag;
}

export function getTagColor(tag: string): string {
  const categoria = extrairCategoria(tag);
  if (TAG_CORES[categoria]) return TAG_CORES[categoria];
  let hash = 0;
  for (let i = 0; i < tag.length; i++) {
    hash = tag.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = ((hash % 360) + 360) % 360;
  return `hsl(${hue}, 100%, 60%)`;
}
