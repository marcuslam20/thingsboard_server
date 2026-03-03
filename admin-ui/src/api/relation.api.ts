///
/// Copyright © 2016-2025 The Thingsboard Authors
///
/// Licensed under the Apache License, Version 2.0 (the "License");
/// you may not use this file except in compliance with the License.
/// You may obtain a copy of the License at
///
///     http://www.apache.org/licenses/LICENSE-2.0
///
/// Unless required by applicable law or agreed to in writing, software
/// distributed under the License is distributed on an "AS IS" BASIS,
/// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
/// See the License for the specific language governing permissions and
/// limitations under the License.
///

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
