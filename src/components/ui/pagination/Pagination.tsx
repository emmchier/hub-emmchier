'use client';

import { useUIStore } from '@/store/ui/ui-store';
import { ChevronLeftIcon, ChevronRightIcon, Button } from '@/components';

interface Props {
  totalItems: number;
}

export const Pagination = ({ totalItems }: Props) => {
  const { currentPage, itemsPerPage, setCurrentPage } = useUIStore();
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  if (totalPages <= 1) return null;

  return (
    <div className="flex text-center justify-center mt-10 mb-32">
      <nav aria-label="Page navigation">
        <ul className="flex gap-2 items-center">
          {/* Prev Button */}
          <li>
            <Button
              ariaLabel="Previous page"
              variant="outlined"
              size="m"
              icon={<ChevronLeftIcon />}
              iconButton
              state={currentPage === 1 ? 'disabled' : 'enabled'}
              onClick={() => handlePageChange(currentPage - 1)}
            />
          </li>

          {/* Page Numbers */}
          {Array.from({ length: totalPages }, (_, i) => {
            const page = i + 1;
            const isSelected = currentPage === page;

            return (
              <li key={page}>
                <Button
                  ariaLabel={`Go to page ${page}`}
                  variant="outlined"
                  size="m"
                  state={isSelected ? 'selected' : 'enabled'}
                  onClick={
                    isSelected ? undefined : () => handlePageChange(page)
                  }
                  tabIndex={isSelected ? -1 : 0}
                  iconButton
                  icon={page}
                  className={[
                    isSelected ? 'pointer-events-none !bg-primary-text' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                />
              </li>
            );
          })}

          {/* Next Button */}
          <li>
            <Button
              ariaLabel="Next page"
              variant="outlined"
              size="m"
              icon={<ChevronRightIcon />}
              iconButton
              state={currentPage === totalPages ? 'disabled' : 'enabled'}
              onClick={() => handlePageChange(currentPage + 1)}
            />
          </li>
        </ul>
      </nav>
    </div>
  );
};
