const buttonBase =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-md px-4 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50';

export const buttonPrimary = `${buttonBase} bg-blue-600 text-white hover:bg-blue-700 disabled:hover:bg-blue-600`;

export const buttonSecondary = `${buttonBase} border border-neutral-300 text-neutral-800 hover:bg-neutral-100 disabled:hover:bg-transparent dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800`;

const iconButtonBase =
  'inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-md transition-colors hover:bg-neutral-100 disabled:opacity-50 dark:hover:bg-neutral-800';

export const iconButton = `${iconButtonBase} text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100`;

export const iconButtonAccent = `${iconButtonBase} text-blue-600 dark:text-blue-400`;

export const textButton =
  'min-h-11 rounded-md px-2 text-sm text-neutral-600 underline-offset-4 hover:text-neutral-900 hover:underline dark:text-neutral-400 dark:hover:text-neutral-100';

export const textLink = 'text-blue-600 underline-offset-4 hover:underline dark:text-blue-400';
