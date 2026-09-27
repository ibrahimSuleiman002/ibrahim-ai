import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Role } from '../types';

interface MarkdownRendererProps {
  content: string;
  role: Role;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, role }) => {
  return (
    <div className={`markdown-content text-sm md:text-base ${role === Role.USER ? 'text-white' : 'text-slate-800'}`}>
      <ReactMarkdown
        components={{
          a: ({ node, ...props }) => (
            <a 
              {...props} 
              target="_blank" 
              rel="noopener noreferrer" 
              className={`underline ${role === Role.USER ? 'text-white hover:text-blue-100' : 'text-blue-600 hover:text-blue-800'}`}
            />
          ),
          code: ({ node, className, children, ...props }) => {
            const match = /language-(\w+)/.exec(className || '');
            const isInline = !match;
            return isInline ? (
               <code className={`${role === Role.USER ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-800'} rounded px-1 py-0.5`} {...props}>
                {children}
               </code>
            ) : (
                <div className="my-2 overflow-hidden rounded-md">
                     <div className="bg-slate-800 text-xs text-slate-400 px-3 py-1 flex justify-between items-center">
                        <span>{match?.[1] || 'Code'}</span>
                    </div>
                    <pre className="bg-slate-900 !p-3 !m-0 overflow-x-auto text-slate-100">
                        <code className={className} {...props}>
                            {children}
                        </code>
                    </pre>
                </div>
            )
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownRenderer;
