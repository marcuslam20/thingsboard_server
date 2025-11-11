import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot } from '@angular/router';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { RuleChain, RuleChainMetaData } from '@shared/models/rule-chain.models';

@Injectable()
export class CustomerRuleChainResolver {
  constructor(private http: HttpClient) {}

  resolve(route: ActivatedRouteSnapshot): Observable<RuleChain> {
    const id = route.params.ruleChainId;
    return this.http.get<RuleChain>(`/api/customer/ruleChain/${id}`);
  }
}

@Injectable()
export class CustomerRuleChainMetaDataResolver {
  constructor(private http: HttpClient) {}

  resolve(route: ActivatedRouteSnapshot): Observable<RuleChainMetaData> {
    const id = route.params.ruleChainId;
    return this.http.get<RuleChainMetaData>(`/api/customer/ruleChain/${id}/metadata`);
  }
}