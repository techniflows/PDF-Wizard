'use client';

import PDFMerger from '@/components/PDFMerger';

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold mb-3 text-gray-800">
            PDF Wizard 🪄
          </h1>
          <p className="text-xl font-semibold text-blue-600 mb-4">
            Your Swiss Army Knife for PDFs & Images
          </p>
          <div className="max-w-3xl mx-auto space-y-2">
            <p className="text-gray-700">
              <span className="font-medium">📑 Split PDFs</span> into individual pages •
              <span className="font-medium"> 🖼️ Convert images</span> to PDF •
              <span className="font-medium"> 🔀 Rearrange</span> pages with drag & drop
            </p>
            <p className="text-gray-700">
              <span className="font-medium">🎯 Merge</span> multiple PDFs & images into one •
              <span className="font-medium"> ✨ Mix & match</span> any combination
            </p>
            <div className="mt-4 inline-flex items-center gap-2 bg-green-50 px-4 py-2 rounded-full">
              <span className="text-green-600 font-semibold">🔒 100% Private</span>
              <span className="text-green-700">- Everything happens on YOUR device. No uploads, no servers!</span>
            </div>
          </div>
        </div>
        <PDFMerger />
      </div>
    </main>
  );
}
