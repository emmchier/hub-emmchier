'use client';

import { WorkData } from '@/interfaces';
import { useDataStore } from '@/store/data/data-store';
import { useEffect } from 'react';

interface DataManagerProps {
  data: WorkData;
}

export const DataManager = ({ data }: DataManagerProps) => {
  const { setCollection, setCurrentCollection } = useDataStore();

  useEffect(() => {
    if (data) {
      setCollection(data);
      setCurrentCollection(data);
    }
  }, [data, setCollection, setCurrentCollection]);

  return <></>;
};
