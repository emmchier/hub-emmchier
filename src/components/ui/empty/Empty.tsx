import { ReactNode } from 'react';
import { Text } from '@/components';

interface EmptyProps {
  content: ReactNode;
}

export const Empty = ({ content }: EmptyProps) => {
  return (
    <div className="flex h-[40vh] w-full items-center justify-center">
      <Text
        type="title"
        size="l"
        weight="regular"
        className="w-full text-center inline-block"
      >
        {content}
      </Text>
    </div>
  );
};
