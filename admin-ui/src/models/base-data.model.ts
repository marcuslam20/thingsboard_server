import { EntityId } from './id.model';

export interface BaseData<T extends EntityId> {
  createdTime: number;
  id: T;
  name: string;
}

export interface ExportableEntity<T extends EntityId> extends BaseData<T> {
  externalId?: T;
}
