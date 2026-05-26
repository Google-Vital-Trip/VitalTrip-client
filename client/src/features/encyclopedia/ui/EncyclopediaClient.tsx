'use client';

import { useInfiniteQuery } from '@tanstack/react-query';
import { useWindowVirtualizer } from '@tanstack/react-virtual';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from '@/src/shared/lib/i18n';
import { CATEGORY_ICONS, CategoryKey, EncyclopediaItem, getCategory } from '../types';
import { EncyclopediaCard } from './EncyclopediaCard';
import { fetchEncyclopediaPage } from '../api/encyclopediaApi';

const CATEGORY_KEYS: CategoryKey[] = [
  'all',
  'infectious',
  'cardiovascular',
  'respiratory',
  'digestive',
  'neurological',
  'injury',
  'other',
];

interface Props {
  initialItems: EncyclopediaItem[];
  total: number;
}

export function EncyclopediaClient({ initialItems, total: initialTotal }: Props) {
  const { t } = useTranslation('common');
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [category, setCategory] = useState<CategoryKey>('all');
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query.trim()), 300);
    return () => clearTimeout(timer);
  }, [query]);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isPending } = useInfiniteQuery({
    queryKey: ['encyclopedia', debouncedQuery],
    queryFn: ({ pageParam }) =>
      fetchEncyclopediaPage({
        search: debouncedQuery || undefined,
        offset: pageParam,
      }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      const loaded = allPages.flatMap((p) => p.items).length;
      return loaded < lastPage.total ? loaded : undefined;
    },
    initialData:
      debouncedQuery === ''
        ? { pages: [{ total: initialTotal, items: initialItems }], pageParams: [0] }
        : undefined,
    initialDataUpdatedAt: debouncedQuery === '' ? Date.now() : undefined,
    staleTime: 1000 * 60 * 5,
  });

  const total = data?.pages[0]?.total ?? initialTotal;

  const filtered = useMemo(() => {
    const items = data?.pages.flatMap((p) => p.items) ?? [];
    if (category === 'all') return items;
    return items.filter((item) => getCategory(item.categories) === category);
  }, [data, category]);

  const virtualizer = useWindowVirtualizer({
    count: filtered.length,
    estimateSize: () => 80,
    overscan: 5,
    paddingEnd: 96,
    scrollMargin: listRef.current?.offsetTop ?? 0,
  });

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [debouncedQuery]);

  useEffect(() => {
    const handleScroll = () => {
      if (isFetchingNextPage || !hasNextPage) return;
      const scrollY = window.scrollY;
      const windowHeight = window.innerHeight;
      const docHeight = document.documentElement.scrollHeight;
      if (docHeight - scrollY - windowHeight < 400) fetchNextPage();
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isFetchingNextPage, hasNextPage, fetchNextPage]);

  return (
    <div className='bg-slate-50'>
      {/* 헤더 + 검색 */}
      <div className='bg-gradient-to-br from-red-600 via-red-600 to-rose-700 px-6 py-8'>
        <div className='mx-auto max-w-3xl'>
          <div className='mb-1 flex items-center gap-2'>
            <span className='text-3xl'>🏥</span>
            <h1 className='text-3xl font-bold tracking-tight text-white'>
              {t('encyclopedia.title')}
            </h1>
          </div>
          <p className='mb-6 text-sm text-red-100'>
            {t('encyclopedia.subtitle', { count: total })}
          </p>
          <div className='relative'>
            <span className='pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-lg text-gray-400'>
              🔍
            </span>
            <input
              type='text'
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('encyclopedia.search_placeholder')}
              className='w-full rounded-2xl bg-white py-3.5 pr-12 pl-11 text-base shadow-lg outline-none placeholder:text-gray-400 focus:ring-2 focus:ring-white/50'
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                aria-label={t('encyclopedia.clear_search')}
                className='absolute top-1/2 right-4 -translate-y-1/2 text-gray-400 transition-colors hover:text-gray-600'
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 카테고리 필터 */}
      <div className='sticky top-16 z-10 border-b border-gray-100 bg-white shadow-sm'>
        <div className='mx-auto max-w-3xl px-4 py-3'>
          <div className='flex gap-2 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden'>
            {CATEGORY_KEYS.map((key) => (
              <button
                key={key}
                onClick={() => setCategory(key)}
                className={`flex flex-shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition-all duration-200 ${
                  category === key
                    ? 'bg-red-500 text-white shadow-sm'
                    : 'bg-gray-50 text-gray-600 hover:bg-red-50 hover:text-red-600'
                }`}
              >
                <span>{CATEGORY_ICONS[key]}</span>
                <span>{t(`encyclopedia.categories.${key}`)}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 결과 카운터 */}
      <div className='mx-auto w-full max-w-3xl px-6 py-2.5'>
        <span className='text-sm text-gray-500'>
          {debouncedQuery
            ? t('encyclopedia.results', { count: total })
            : category !== 'all'
              ? t('encyclopedia.results', { count: filtered.length })
              : t('encyclopedia.total', { count: total })}
        </span>
      </div>

      {/* 가상화 리스트 */}
      <div className='mx-auto w-full max-w-3xl px-2 pb-4'>
        {isPending ? (
          <div className='flex h-64 items-center justify-center text-gray-400'>
            <span className='text-3xl'>⏳</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className='flex h-64 flex-col items-center justify-center rounded-2xl bg-white text-gray-400'>
            <span className='mb-3 text-5xl'>🔍</span>
            <p className='font-medium text-gray-500'>{t('encyclopedia.no_results')}</p>
            <p className='mt-1 text-sm'>{t('encyclopedia.no_results_hint')}</p>
          </div>
        ) : (
          <>
            <div ref={listRef} style={{ height: virtualizer.getTotalSize(), position: 'relative' }}>
              {virtualizer.getVirtualItems().map((virtualItem) => {
                const item = filtered[virtualItem.index];
                const categoryLabel = t(`encyclopedia.categories.${getCategory(item.categories)}`);
                return (
                  <div
                    key={virtualItem.key}
                    data-index={virtualItem.index}
                    ref={virtualizer.measureElement}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      transform: `translateY(${virtualItem.start - virtualizer.options.scrollMargin}px)`,
                    }}
                  >
                    <EncyclopediaCard item={item} categoryLabel={categoryLabel} />
                  </div>
                );
              })}
            </div>
            {isFetchingNextPage && (
              <div className='py-3 text-center text-sm text-gray-400'>불러오는 중...</div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
