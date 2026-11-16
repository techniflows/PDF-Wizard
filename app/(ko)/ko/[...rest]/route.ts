import { notFoundResponse } from '@/utils/notFoundHtml';

// A not-found page rendered through the layout leaves the server HTML without a lang attribute.
export const GET = () => notFoundResponse('ko');
export const HEAD = GET;
