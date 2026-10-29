import type { usePublicBracket } from '@/hooks/usePublicBracket';

export type BracketPhase = ReturnType<typeof usePublicBracket>['phases'][number];
