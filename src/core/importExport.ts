// ── IMPORT / EXPORT ──
// Pure utility functions — no DOM listeners, no document.getElementById.
// React components handle file picker and status display.

import { appState } from '../core/state';
import { getNote, saveHub } from '../core/storage';
import { parseMarkdown } from '../core/markdown';
import { useAppStore } from '../store';

declare const html2pdf: any;

// === PDF EXPORT ===
export function exportNoteToPDF(nid: string): void {
  const note = getNote(nid);
  if (!note) return;

  if (note.type !== 'note') {
    alert("Only markdown notes can be exported to PDF right now.");
    return;
  }

  // Create a temporary hidden div
  const tempDiv = document.createElement('div');
  const renderedHTML = parseMarkdown(note.body || '');
  
  tempDiv.innerHTML = `
    <div style="padding: 24px; font-family: 'JetBrains Mono', monospace; font-size: 14px; color: #000; line-height: 1.6; max-width: 800px; margin: 0 auto;">
      <h1 style="font-family: 'Instrument Serif', serif; font-size: 32px; font-weight: normal; margin-bottom: 24px;">${note.title}</h1>
      ${renderedHTML}
    </div>
  `;

  import('html2pdf.js').then((module) => {
    const html2pdfLib = module.default || module;
    const opt = {
      margin:       0.5,
      filename:     `${note.title || 'note'}.pdf`,
      image:        { type: 'jpeg' as const, quality: 0.98 },
      html2canvas:  { scale: 2 },
      jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' as const }
    };
    html2pdfLib().from(tempDiv).set(opt).save();
  }).catch((err) => {
    console.error("Failed to load html2pdf.js", err);
    alert("Could not export to PDF. Check console for details.");
  });
}

// === SMART IMPORT ===
const CLOUD_FUNCTION_URL = 'https://cloudflare-ai.wxchong2480.workers.dev';

export async function importFile(file: File): Promise<void> {
  let text = '';
  
  if (file.name.toLowerCase().endsWith('.pdf')) {
    text = await extractTextFromPDF(file);
  } else {
    // txt, md
    text = await file.text();
  }

  if (!text.trim()) {
    console.warn(`File ${file.name} is empty or unreadable.`);
    return;
  }

  // 1. Categorize using AI
  const suggestedCategory = await categorizeTextWithAI(text, file.name);

  // 2. Create Note
  const newNoteId = 'n' + Date.now() + Math.random().toString(36).slice(2, 6);
  const newNote = {
    id: newNoteId,
    type: 'note' as const,
    title: file.name.replace(/\.[^/.]+$/, ""), // strip extension
    body: text,
    created: new Date().toISOString(),
    tags: ['imported']
  };

  // 3. Find or create folder
  const store = useAppStore.getState();
  const hub = JSON.parse(JSON.stringify(store.hub));
  let targetFolder = hub.folders.find((f: any) => f.name.toLowerCase() === suggestedCategory.toLowerCase());
  if (!targetFolder) {
    targetFolder = {
      id: 'f' + Date.now() + Math.random().toString(36).slice(2, 6),
      name: suggestedCategory,
      open: true,
      notes: []
    };
    hub.folders.push(targetFolder);
  }

  // Add the note
  targetFolder.notes.unshift(newNote);
  targetFolder.open = true;

  // Save & update UI via Zustand
  store.setHub(hub);
  appState.hub = hub;
  saveHub();
  store.setActiveFile(newNoteId);
}

async function extractTextFromPDF(file: File): Promise<string> {
  try {
    const pdfjs = await import('pdfjs-dist');
    // @ts-ignore
    const pdfjsWorkerUrl = await import('pdfjs-dist/build/pdf.worker.mjs?url');
    pdfjs.GlobalWorkerOptions.workerSrc = pdfjsWorkerUrl.default;

    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;

    let fullText = '';
    const maxPages = Math.min(pdf.numPages, 5);
    for (let i = 1; i <= maxPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item: any) => item.str).join(' ');
      fullText += pageText + '\n';
    }

    return fullText;
  } catch (err) {
    console.error("PDF Extraction Error:", err);
    return "Failed to extract text from PDF.";
  }
}

async function categorizeTextWithAI(text: string, filename: string): Promise<string> {
  if (!appState.currentUser) return "Imported"; // Fallback if not logged in

  const token = await appState.currentUser.getIdToken();
  const maxChars = 1500;
  
  const cleanText = text.replace(/[\u0000-\u001F\u007F-\u009F]/g, "").trim();
  const snippet = cleanText.slice(0, maxChars); 
  
  const prompt = `Based on this text from a file named "${filename}", suggest ONE short category name (like Biology, Finances, Drafts, etc.) that would act as a good folder name. Return ONLY the folder name, nothing else. Text summary: ${snippet}`;

  try {
    const res = await fetch(CLOUD_FUNCTION_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ prompt, mode: 'note' }),
    });

    if (!res.ok) {
      console.warn(`Cloudflare AI responded with ${res.status}: defaulting to 'Imported'.`);
      return "Imported";
    }

    const data = await res.json();
    let folder = (data.markdown || "Imported").trim();
    folder = folder.replace(/['"]/g, '');
    if (folder.length > 25) folder = "Imported";
    if (folder.length > 0) folder = folder.charAt(0).toUpperCase() + folder.slice(1);
    
    return folder;
  } catch (err) {
    console.error("AI Categorization Error:", err);
    return "Imported";
  }
}
