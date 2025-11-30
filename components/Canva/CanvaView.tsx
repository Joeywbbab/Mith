import React, { useCallback, useRef, useState, useEffect } from 'react';
import { Excalidraw } from '@excalidraw/excalidraw';
import { useStore } from '../../context/StoreContext';
import type { ExcalidrawElement } from '@excalidraw/excalidraw/types/element/types';
import type { AppState, BinaryFiles } from '@excalidraw/excalidraw/types/types';
import '@excalidraw/excalidraw/index.css';

export const CanvaView: React.FC = () => {
  const { canvaData, updateCanvaData } = useStore();
  const excalidrawRef = useRef<any>(null);
  const [isReady, setIsReady] = useState(false);

  // Delay mounting to ensure proper sizing
  useEffect(() => {
    const timer = setTimeout(() => setIsReady(true), 50);
    return () => clearTimeout(timer);
  }, []);

  const handleChange = useCallback(
    (elements: readonly ExcalidrawElement[], appState: AppState, files: BinaryFiles) => {
      updateCanvaData({
        elements,
        appState: {
          viewBackgroundColor: appState.viewBackgroundColor,
          currentItemFontFamily: appState.currentItemFontFamily,
          zoom: appState.zoom,
          scrollX: appState.scrollX,
          scrollY: appState.scrollY,
        },
        files,
      });
    },
    [updateCanvaData]
  );

  if (!isReady) {
    return <div className="h-full w-full flex items-center justify-center text-zinc-400">Loading canvas...</div>;
  }

  return (
    <div style={{ height: '100%', width: '100%' }}>
      <Excalidraw
        ref={excalidrawRef}
        initialData={{
          elements: canvaData.elements as ExcalidrawElement[],
          appState: canvaData.appState,
          files: canvaData.files,
        }}
        onChange={handleChange}
        theme="light"
        UIOptions={{
          canvasActions: {
            loadScene: true,
            export: { saveFileToDisk: true },
            saveToActiveFile: false,
          },
        }}
      />
    </div>
  );
};
