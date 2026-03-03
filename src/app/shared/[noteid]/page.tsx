import React from 'react';
import { validatePublicNoteAccess } from '@/lib/appwrite';
import SharedNoteClient from './SharedNoteClient';

function stripMarkdown(md?: string) {
   if (!md) return '';
   let text = md.replace(/!\[[^\]]*\]\([^)]*\)/g, '');
   text = text.replace(/\[([^\]]+)\]\([^)]*\)/g, '$1');
   text = text.replace(/```[\s\S]*?```/g, '');
   text = text.replace(/`[^`]*`/g, '');
   text = text.replace(/^[#>\-\*\+]{1,}\s?/gm, '');
   text = text.replace(/[\*\_\~\#\>]/g, '');
   text = text.replace(/\s+/g, ' ').trim();
   return text;
}

function firstParagraph(md?: string) {
   const plain = stripMarkdown(md);
   if (!plain) return '';
   const paras = plain.split(/\n\s*\n/).map(p => p.trim()).filter(Boolean);
   if (paras.length) return paras[0];
   const lines = plain.split(/\n/).map(l => l.trim()).filter(Boolean);
   return lines[0] || plain;
}

function smartTruncate(s: string | undefined, n: number) {
   if (!s) return '...';
   const cleaned = s.trim();
   // Always end in ellipses as requested
   if (cleaned.length <= n) return cleaned + '...';
   let truncated = cleaned.slice(0, n);
   const lastSpace = truncated.lastIndexOf(' ');
   if (lastSpace > 0) truncated = truncated.slice(0, lastSpace);
   return truncated.trim() + '...';
}

export async function generateMetadata({ params }: { params: Promise<{ noteid: string }> }) {
   try {
     const { noteid } = await params;
     const note = await validatePublicNoteAccess(noteid);
     const baseUrl = (process.env.NEXT_PUBLIC_APP_URI || 'http://localhost:3001').replace(/\/$/, '');

     if (!note) {
       return {
         title: 'Note Not Found • Kylrix Note',
         description: 'This note is not available or is not public.'
       };
     }

     const titleText = note.title && note.title.trim() ? smartTruncate(note.title.trim(), 60) : smartTruncate(firstParagraph(note.content || undefined), 60);
     const description = smartTruncate(firstParagraph(note.content || undefined) || 'Shared via Kylrix Note', 160);
     const url = `${baseUrl}/shared/${noteid}`;
     const image = `${baseUrl}/api/og/note/${noteid}`;

     return {
       title: titleText,
       description,
       openGraph: {
         title: titleText,
         description,
         url,
         images: [
           {
             url: image,
             alt: `Shared Note: ${titleText}`,
             width: 1200,
             height: 630
           }
         ],
         siteName: 'Kylrix Note',
         type: 'article'
       },
       twitter: {
         card: 'summary_large_image',
         title: titleText,
         description,
         images: [image]
       }
     } as any;
   } catch (err: any) {
     return {
       title: 'Shared Note • Kylrix Note',
       description: 'A note shared via Kylrix Note.'
     };
   }
}

export default async function SharedNotePage({ params }: { params: Promise<{ noteid: string }> }) {
   // Server only renders shell - actual note fetching happens client-side
   // This ensures Turnstile verification and rate limiting are enforced before database access
   const { noteid } = await params;
   return <SharedNoteClient noteId={noteid} />;
}
