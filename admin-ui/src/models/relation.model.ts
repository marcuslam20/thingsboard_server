import { EntityId } from './id.model';

export type EntitySearchDirection = 'FROM' | 'TO';

export type RelationTypeGroup = 'COMMON' | 'ALARM' | 'DASHBOARD' | 'RULE_CHAIN' | 'RULE_NODE' | 'EDGE';

export interface EntityRelation {
  from: EntityId;
  to: EntityId;
  type: string;
  typeGroup: RelationTypeGroup;
  additionalInfo?: Record<string, unknown>;
}

export interface EntityRelationInfo extends EntityRelation {
  fromName?: string;
  toName?: string;
  toEntityTypeName?: string;
  fromEntityTypeName?: string;
}

export interface RelationsSearchParameters {
  rootId: string;
  rootType: string;
  direction: EntitySearchDirection;
  relationTypeGroup?: RelationTypeGroup;
  maxLevel?: number;
  fetchLastLevelOnly?: boolean;
}

export interface EntityRelationQuery {
  parameters: RelationsSearchParameters;
  filters?: Array<{
    relationType: string;
    entityTypes?: string[];
  }>;
}
