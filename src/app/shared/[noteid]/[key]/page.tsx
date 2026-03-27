import React from 'react';
import SharedNoteClient from '../SharedNoteClient';

export async function generateMetadata({ params: _params }: { params: Promise<{ noteid: string; key: string }> }) {
   return {
     title: 'Shared Encrypted Note • Kylrix Note',
     description: 'This is a secure, encrypted ghost note shared via Kylrix.'
   };
}

export default async function SharedNotePage({ params }: { params: Promise<{ noteid: string; key: string }> }) {
   const { noteid } = await params;
   return <SharedNoteClient noteId={noteid} />;
}
