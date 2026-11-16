import {noteSession} from '$domain/notes';
export const notes = noteSession('aegis-owner', 'sidebar')!;
