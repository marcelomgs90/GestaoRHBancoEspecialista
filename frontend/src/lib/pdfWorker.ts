import { pdfjs } from 'react-pdf'

import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'

let configured = false

export function configurePdfWorker() {
  if (configured) return
  pdfjs.GlobalWorkerOptions.workerSrc = pdfWorkerUrl
  configured = true
}
