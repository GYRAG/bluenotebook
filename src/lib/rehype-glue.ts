// Georgian attaches case endings to math with a hyphen ($O$-ს, $180^\circ$-ით). Keep the
// ending — and any punctuation right after the formula — on the same line as the formula:
// wrap KaTeX + "-ending." in a no-wrap span.
interface Node { type: string; value?: string; tagName?: string; properties?: { className?: string[] }; children?: Node[] }

export default function rehypeGlue() {
  const visit = (node: Node) => {
    const kids = node.children;
    if (!kids) return;
    for (let i = 0; i < kids.length; i++) {
      const c = kids[i]!, next = kids[i + 1];
      const m = c.properties?.className?.includes('katex') && next?.type === 'text' ? next.value!.match(/^(?:-[\u10D0-\u10FF]+[.,;:!?]*|[.,;:!?]+)/) : null;
      if (m) {
        next!.value = next!.value!.slice(m[0].length);
        kids[i] = { type: 'element', tagName: 'span', properties: { className: ['nw'] }, children: [c, { type: 'text', value: m[0] }] };
      } else visit(c);
    }
  };
  return (tree: Node) => visit(tree);
}
