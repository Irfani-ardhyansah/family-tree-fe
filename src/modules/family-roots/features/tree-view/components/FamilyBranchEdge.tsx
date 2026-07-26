import { memo, useCallback } from 'react';
import { useStore, type EdgeProps, type Node } from 'reactflow';
import { NODE_HEIGHT, NODE_WIDTH } from '@/shared/utils/treeLayout';

export type FamilyBranchEdgeData = {
  fatherId?: string;
  motherId?: string;
  childIds: string[];
  dimmed?: boolean;
  highlighted?: boolean;
  descendantHighlighted?: boolean;
};

type Anchor = { x: number; top: number; bottom: number };

function getAnchor(node: Node | undefined): Anchor | null {
  if (!node) return null;
  const w = node.width ?? NODE_WIDTH;
  const h = node.height ?? NODE_HEIGHT;
  const x = (node.positionAbsolute?.x ?? node.position.x) + w / 2;
  const y = node.positionAbsolute?.y ?? node.position.y;
  return { x, top: y, bottom: y + h };
}

/** Satu edge = satu cabang keluarga (ayah+ibu menyatu, lalu ke anak) — tanpa junction node. */
function FamilyBranchEdge({ id, data }: EdgeProps<FamilyBranchEdgeData>) {
  const fatherId = data?.fatherId;
  const motherId = data?.motherId;
  const childIds = data?.childIds ?? [];
  const dimmed = data?.dimmed ?? false;
  const highlighted = data?.highlighted ?? false;
  const descendantHighlighted = data?.descendantHighlighted ?? false;

  const anchors = useStore(
    useCallback(
      (state) => {
        const read = (nid?: string) =>
          nid ? getAnchor(state.nodeInternals.get(nid)) : null;
        return {
          father: read(fatherId),
          mother: read(motherId),
          children: childIds
            .map((cid) => read(cid))
            .filter((a): a is Anchor => !!a),
        };
      },
      [fatherId, motherId, childIds],
    ),
  );

  const { father, mother, children } = anchors;
  if (children.length === 0) return null;
  if (!father && !mother) return null;

  const parents = [father, mother].filter((p): p is Anchor => !!p);
  const coupleMidX = parents.reduce((s, p) => s + p.x, 0) / parents.length;
  const parentBottom = Math.max(...parents.map((p) => p.bottom));
  const childTop = Math.min(...children.map((c) => c.top));
  const gap = Math.max(childTop - parentBottom, 24);
  const unionY = parentBottom + gap * 0.42;
  const railY = children.length > 1 ? childTop - gap * 0.22 : unionY;

  const opacity = dimmed ? 0.28 : 1;
  const strokeW = highlighted || descendantHighlighted ? 3 : 2;
  const blue = highlighted ? '#1D4ED8' : descendantHighlighted ? '#0F766E' : '#2563EB';
  const pink = highlighted ? '#BE185D' : descendantHighlighted ? '#0D9488' : '#DB2777';
  const stem = highlighted
    ? '#7C3AED'
    : descendantHighlighted
      ? '#14B8A6'
      : '#64748B';

  const elbow = (fromX: number, fromY: number, toX: number, midY: number) =>
    `M ${fromX} ${fromY} L ${fromX} ${midY} L ${toX} ${midY}`;

  const paths: { d: string; stroke: string }[] = [];

  if (father) {
    paths.push({
      d: elbow(father.x, father.bottom, coupleMidX, unionY),
      stroke: blue,
    });
  }
  if (mother) {
    paths.push({
      d: elbow(mother.x, mother.bottom, coupleMidX, unionY),
      stroke: pink,
    });
  }

  // Batang vertikal dari titik temu
  paths.push({
    d: `M ${coupleMidX} ${unionY} L ${coupleMidX} ${railY}`,
    stroke: stem,
  });

  if (children.length === 1) {
    const child = children[0];
    if (Math.abs(child.x - coupleMidX) > 0.5) {
      paths.push({
        d: `M ${coupleMidX} ${railY} L ${child.x} ${railY}`,
        stroke: stem,
      });
    }
    paths.push({
      d: `M ${child.x} ${railY} L ${child.x} ${child.top}`,
      stroke: stem,
    });
  } else {
    const xs = children.map((c) => c.x);
    const minX = Math.min(...xs, coupleMidX);
    const maxX = Math.max(...xs, coupleMidX);
    paths.push({
      d: `M ${minX} ${railY} L ${maxX} ${railY}`,
      stroke: stem,
    });
    for (const child of children) {
      paths.push({
        d: `M ${child.x} ${railY} L ${child.x} ${child.top}`,
        stroke: stem,
      });
    }
  }

  return (
    <g id={id} className="react-flow__edge family-branch-edge" opacity={opacity}>
      {paths.map((p, i) => (
        <path
          key={`${id}-${i}`}
          d={p.d}
          fill="none"
          stroke={p.stroke}
          strokeWidth={strokeW}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ))}
    </g>
  );
}

export default memo(FamilyBranchEdge);
