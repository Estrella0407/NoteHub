// ── GRAPH VIEW (D3 Force Graph) ──
// Uses graph.css for all styling. Matches the old graph HTML layout:
// #graph-controls → distance slider, search, close button
// #graph-svg-wrap → SVG canvas, tooltip, legend

import React, { useEffect, useRef, useState, useCallback } from 'react';
import './GraphView.css';
import * as d3 from 'd3';
import { useAppStore } from '../store';
import { Icon } from '../ui/Icons';

interface GraphNode {
  id: string; title: string; body: string;
  tags: string[]; type: string; folder: string;
  x?: number; y?: number; fx?: number | null; fy?: number | null;
}

interface GraphLink {
  source: string | GraphNode;
  target: string | GraphNode;
  linkType: 'wiki' | 'tag' | 'both';
  tag?: string;
}

export default function GraphView() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const hub = useAppStore(state => state.hub);
  const setPanel = useAppStore(state => state.setPanel);
  const setActiveFile = useAppStore(state => state.setActiveFile);
  const [searchQuery, setSearchQuery] = useState('');
  const [distance, setDistance] = useState(140);

  // ── Build graph data from hub ──
  const buildGraphData = useCallback(() => {
    if (!hub || !hub.folders) return { nodes: [] as GraphNode[], links: [] as GraphLink[] };
    const allNotes = hub.folders.flatMap(f => f.notes);
    const nodes: GraphNode[] = allNotes.map(n => ({
      id: n.id, title: n.title || 'Untitled', body: n.body || '',
      tags: n.tags || [], type: n.type || 'note',
      folder: hub.folders.find(f => f.notes.some(x => x.id === n.id))?.name || '',
    }));
    const titleMap: Record<string, string> = {};
    nodes.forEach(n => { titleMap[n.title.toLowerCase()] = n.id; });
    const links: GraphLink[] = [];
    const seen = new Set<string>();

    // Wikilinks: [[Note Title]]
    nodes.forEach(n => {
      const matches = n.body.matchAll(/\[\[([^\]]+)\]\]/g);
      for (const m of matches) {
        const tid = titleMap[m[1].toLowerCase()];
        if (tid && tid !== n.id) {
          const key = [n.id, tid].sort().join('|');
          if (!seen.has(key)) { seen.add(key); links.push({ source: n.id, target: tid, linkType: 'wiki' }); }
        }
      }
    });

    // Shared tags
    nodes.forEach((a, i) => {
      if (!a.tags.length) return;
      nodes.forEach((b, j) => {
        if (j <= i) return;
        const sharedTag = a.tags.find(t => b.tags.includes(t));
        if (!sharedTag) return;
        const key = [a.id, b.id].sort().join('|');
        if (!seen.has(key)) { seen.add(key); links.push({ source: a.id, target: b.id, linkType: 'tag', tag: sharedTag }); }
      });
    });

    return { nodes, links };
  }, [hub]);

  function nodeColor(d: GraphNode): string {
    if (d.type === 'canvas') return 'var(--text-bright)';
    if (d.tags.length > 0) return 'var(--text-mid)';
    return 'var(--accent)';
  }

  function nodeRadius(d: GraphNode, links: GraphLink[]): number {
    const degree = links.filter(l => {
      const s = (l.source as GraphNode)?.id || l.source as string;
      const t = (l.target as GraphNode)?.id || l.target as string;
      return s === d.id || t === d.id;
    }).length;
    return Math.max(7, 7 + degree * 2.5);
  }

  // ── Tooltip helpers ──
  const showTooltip = useCallback((d: GraphNode, x: number, y: number) => {
    const tt = tooltipRef.current;
    if (!tt) return;
    const tagsHtml = d.tags.length
      ? `<div class="tt-tags">${d.tags.map(t => `<span>${t}</span>`).join('')}</div>`
      : '';
    const snippet = d.body.slice(0, 100).replace(/[#*>\-\[\]]/g, '').trim();
    tt.innerHTML = `
      <div class="tt-title">${d.title}</div>
      <div class="tt-type">${d.type} · ${d.folder}</div>
      ${tagsHtml}
      ${snippet ? `<div class="tt-body">${snippet}${d.body.length > 100 ? '…' : ''}</div>` : ''}
      <div class="tt-hint">Click to open</div>
    `;
    tt.style.display = 'block';
    tt.style.left = x + 16 + 'px';
    tt.style.top = y - 10 + 'px';
  }, []);

  const hideTooltip = useCallback(() => {
    const tt = tooltipRef.current;
    if (tt) tt.style.display = 'none';
  }, []);

  // ── D3 Force Simulation ──
  useEffect(() => {
    if (!svgRef.current || !wrapRef.current) return;
    const W = wrapRef.current.clientWidth || 800;
    const H = wrapRef.current.clientHeight || 600;

    let { nodes, links } = buildGraphData();

    // Filter by search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const visIds = new Set(nodes.filter(n =>
        n.title.toLowerCase().includes(q) || n.tags.some(t => t.toLowerCase().includes(q))
      ).map(n => n.id));
      nodes = nodes.filter(n => visIds.has(n.id));
      links = links.filter(l => {
        const s = (l.source as GraphNode)?.id || l.source as string;
        const t = (l.target as GraphNode)?.id || l.target as string;
        return visIds.has(s) && visIds.has(t);
      });
    }

    const svg = d3.select(svgRef.current).attr('width', W).attr('height', H);
    svg.selectAll('*').remove();

    const zoom = d3.zoom().scaleExtent([0.15, 5]).on('zoom', (e: any) => g.attr('transform', e.transform));
    svg.call(zoom as any);
    const g = svg.append('g');

    const sim = d3.forceSimulation(nodes as any)
      .force('link', d3.forceLink(links).id((d: any) => d.id).distance(distance).strength(0.5))
      .force('charge', d3.forceManyBody().strength(-220))
      .force('center', d3.forceCenter(W / 2, H / 2))
      .force('collision', d3.forceCollide((d: any) => nodeRadius(d, links) + 10));

    // Links
    const linkSel = g.append('g').selectAll('line')
      .data(links).join('line')
      .attr('stroke', (d: any) => d.linkType === 'wiki' ? 'var(--accent)' : 'var(--text-dim)')
      .attr('stroke-width', 1.2)
      .attr('stroke-dasharray', (d: any) => d.linkType === 'tag' ? '4,3' : 'none')
      .attr('opacity', (d: any) => d.linkType === 'wiki' ? 0.35 : 0.25);

    // Node groups
    const nodeGroup = g.append('g').selectAll('g').data(nodes).join('g')
      .attr('cursor', 'pointer')
      .call((d3.drag() as any)
        .on('start', (e: any, d: any) => { if (!e.active) sim.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y; })
        .on('drag', (e: any, d: any) => { d.fx = e.x; d.fy = e.y; })
        .on('end', (e: any, d: any) => { if (!e.active) sim.alphaTarget(0); d.fx = null; d.fy = null; })
      );

    // Node circles with glow
    nodeGroup.append('circle')
      .attr('r', (d: any) => nodeRadius(d, links))
      .attr('fill', (d: any) => nodeColor(d)).attr('fill-opacity', 0.15)
      .attr('stroke', (d: any) => nodeColor(d)).attr('stroke-width', 2);

    // Node labels
    nodeGroup.append('text')
      .text((d: any) => d.title.length > 18 ? d.title.slice(0, 16) + '…' : d.title)
      .attr('fill', 'var(--text-main)').attr('font-size', '10px')
      .attr('font-family', 'var(--font-mono)')
      .attr('text-anchor', 'middle').attr('dy', (d: any) => nodeRadius(d, links) + 15);

    // Click → open note
    nodeGroup.on('click', (_e: any, d: any) => {
      setPanel('files');
      setActiveFile(d.id);
    });

    // Hover → tooltip
    nodeGroup.on('mouseenter', (e: any, d: any) => {
      const rect = wrapRef.current?.getBoundingClientRect();
      if (!rect) return;
      showTooltip(d, e.clientX - rect.left, e.clientY - rect.top);
    });
    nodeGroup.on('mouseleave', () => hideTooltip());

    sim.on('tick', () => {
      linkSel.attr('x1', (d: any) => d.source.x).attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x).attr('y2', (d: any) => d.target.y);
      nodeGroup.attr('transform', (d: any) => `translate(${d.x},${d.y})`);
    });

    return () => { sim.stop(); };
  }, [hub, searchQuery, distance, buildGraphData, showTooltip, hideTooltip, setPanel, setActiveFile]);

  return (
    <div id="graph-slot">
      <div id="graph-view">
        {/* ── Controls bar ── */}
        <div id="graph-controls">
          <div className="graph-ctrl-group">
            <span className="ctrl-label">Distance</span>
            <input
              type="range"
              className="global-slider"
              id="ctrl-distance"
              min={60} max={300}
              value={distance}
              onChange={e => setDistance(+e.target.value)}
              style={{ width: '64px' }}
            />
          </div>

          <div className="ctrl-sep" />

          <div className="global-search-wrap" style={{ width: '400px'}}>
            <Icon name="search" size={13} />
            <input
              className="global-input"
              type="text"
              placeholder="Find node or tag…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* ── SVG canvas + tooltip + legend ── */}
        <div id="graph-svg-wrap" ref={wrapRef}>
          <svg ref={svgRef} id="graph-svg" />

          <div id="graph-tooltip" ref={tooltipRef} />

          <div id="graph-legend">
            <div className="leg-row">
              <span className="leg-dot" style={{ background: 'var(--accent)' }} />
              <span>note</span>
            </div>
            <div className="leg-row">
              <span className="leg-dot" style={{ background: 'var(--accent3, #f7c87b)' }} />
              <span>tagged</span>
            </div>
            <div className="leg-row">
              <span className="leg-dot" style={{ background: 'var(--accent2, #5bc8f5)' }} />
              <span>canvas</span>
            </div>
            <div className="leg-row">
              <Icon name="wikilink" size={13} />
              <span>wikilink</span>
            </div>
            <div className="leg-row">
              <Icon name="sharedTag" size={13} />
              <span>shared tag</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
