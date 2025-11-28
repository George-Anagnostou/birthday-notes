'use client';

import { useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import 'react-quill/dist/quill.snow.css';

// Dynamically import ReactQuill to avoid SSR issues
const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  maxLength?: number;
}

export default function RichTextEditor({
  value,
  onChange,
  placeholder = 'Write your heartfelt birthday wishes here...',
  maxLength = 5000
}: RichTextEditorProps) {
  // Custom toolbar with essential formatting options
  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'color': [] }, { 'background': [] }],
      ['link'],
      ['clean']
    ],
  };

  const formats = [
    'header',
    'bold', 'italic', 'underline', 'strike',
    'list', 'bullet',
    'color', 'background',
    'link'
  ];

  // Handle content change with character limit
  const handleChange = (content: string) => {
    // Get plain text length for character count
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = content;
    const textLength = tempDiv.textContent?.length || 0;

    // Only update if within character limit
    if (textLength <= maxLength) {
      onChange(content);
    }
  };

  return (
    <div className="rich-text-editor">
      <ReactQuill
        theme="snow"
        value={value}
        onChange={handleChange}
        modules={modules}
        formats={formats}
        placeholder={placeholder}
        className="bg-white rounded-xl border-2 border-pink-200 focus-within:ring-2 focus-within:ring-pink-500 focus-within:border-transparent transition-all"
      />
      <style jsx global>{`
        .rich-text-editor .ql-container {
          min-height: 200px;
          font-size: 16px;
        }
        .rich-text-editor .ql-editor {
          min-height: 200px;
        }
        .rich-text-editor .ql-toolbar {
          border-top-left-radius: 0.75rem;
          border-top-right-radius: 0.75rem;
          border-color: rgb(251 207 232);
          background-color: rgb(253 242 248);
        }
        .rich-text-editor .ql-container {
          border-bottom-left-radius: 0.75rem;
          border-bottom-right-radius: 0.75rem;
          border-color: rgb(251 207 232);
        }
        .rich-text-editor .ql-editor.ql-blank::before {
          color: rgb(156 163 175);
          font-style: italic;
        }
      `}</style>
    </div>
  );
}
