import api from './client';
import { EntityRelation, EntityRelationInfo, EntitySearchDirection } from '@/models/relation.model';

export const relationApi = {
  saveRelation(relation: EntityRelation): Promise<void> {
    return api.post('/api/relation', relation).then(() => undefined);
  },

  deleteRelation(fromId: string, fromType: string, relationType: string, toId: string, toType: string): Promise<void> {
    return api.delete('/api/relation', {
      params: { fromId, fromType, relationType, relationTypeGroup: 'COMMON', toId, toType },
    }).then(() => undefined);
  },

  findInfoByFrom(fromId: string, fromType: string): Promise<EntityRelationInfo[]> {
    return api.get('/api/relations/info', {
      params: { fromId, fromType },
    }).then((r) => r.data);
  },

  findInfoByTo(toId: string, toType: string): Promise<EntityRelationInfo[]> {
    return api.get('/api/relations/info', {
      params: { toId, toType },
    }).then((r) => r.data);
  },

  findByQuery(query: { parameters: { rootId: string; rootType: string; direction: EntitySearchDirection } }): Promise<EntityRelation[]> {
    return api.post('/api/relations', query).then((r) => r.data);
  },

  getRelationTypes(): Promise<string[]> {
    return api.get('/api/relations/types').then((r) => r.data);
  },
};
