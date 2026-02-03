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

import { Component, EventEmitter, Input, Output, OnChanges, SimpleChanges } from '@angular/core';

export interface DataPoint {
  id: string;
  code: string;
  name: string;
  type: 'bool' | 'value' | 'enum' | 'string';
  rw: 'r' | 'w' | 'rw';
  min?: number;
  max?: number;
  unit?: string;
}

export interface DpList {
  dp: DataPoint[];
}

@Component({
  selector: 'tb-dp-list-editor',
  templateUrl: './dp-list-editor.component.html',
  styleUrls: ['./dp-list-editor.component.scss']
})
export class DpListEditorComponent implements OnChanges {
  @Input() dpList: DpList = { dp: [] };
  @Output() dpListChange = new EventEmitter<DpList>();

  displayedColumns = ['id', 'code', 'name', 'type', 'rw', 'min', 'max', 'unit', 'actions'];
  dataSource: DataPoint[] = [];

  ngOnChanges(changes: SimpleChanges) {
    if (changes['dpList'] && this.dpList?.dp) {
      this.dataSource = [...this.dpList.dp]; // Copy để reactive
    }
  }

  addDp() {
    const newDp: DataPoint = {
      id: (this.dataSource.length + 1).toString(),
      code: '',
      name: '',
      type: 'bool',
      rw: 'rw'
    };
    this.dataSource = [...this.dataSource, newDp]; // Trigger change detection
    this.emitChange();
  }

  removeDp(index: number) {
    this.dataSource = this.dataSource.filter((_, i) => i !== index);
    this.emitChange();
  }

  trackByFn(index: number, item: DataPoint) {
    return index;
  }

  emitChange() {
    this.dpListChange.emit({ dp: [...this.dataSource] });
  }
}