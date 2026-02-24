export interface PageData<T> {
  data: T[];
  totalPages: number;
  totalElements: number;
  hasNext: boolean;
}

export interface PageLink {
  pageSize: number;
  page: number;
  textSearch?: string;
  sortProperty?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export function pageLink(pageSize: number, page: number, textSearch?: string, sortProperty?: string, sortOrder?: 'ASC' | 'DESC'): PageLink {
  return { pageSize, page, textSearch, sortProperty, sortOrder };
}

export function pageLinkToQueryParams(pl: PageLink): Record<string, string> {
  const params: Record<string, string> = {
    pageSize: String(pl.pageSize),
    page: String(pl.page),
  };
  if (pl.textSearch) params.textSearch = pl.textSearch;
  if (pl.sortProperty) params.sortProperty = pl.sortProperty;
  if (pl.sortOrder) params.sortOrder = pl.sortOrder;
  return params;
}
