import { FC } from 'react';

export type FCC<P = NonNullable<unknown>> = FC<
  P & { children?: React.ReactNode }
>;
