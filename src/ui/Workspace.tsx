import React from 'react';
import { useAppStore } from '../store';
import GraphView from '../features/GraphView';
import CalendarView from '../features/CalendarView';
import Editor from '../features/Editor';
import CanvasTab from '../features/CanvasTab';
import TabsBar from '../ui/TabsBar';

export default function Workspace() {
  const currentPanel = useAppStore((state) => state.currentPanel);

  if (currentPanel === 'graph') return <GraphView />;
  if (currentPanel === 'calendar') return <CalendarView />;

  return (
    <div id="editor-area" className="react-workspace" style={{ flex: 1, width: '100%', height: '100%', minWidth: 0, display: 'flex', flexDirection: 'column' }}>
      <TabsBar />
      {currentPanel === 'canvas' ? <CanvasTab /> : <Editor />}
    </div>
  );
}
