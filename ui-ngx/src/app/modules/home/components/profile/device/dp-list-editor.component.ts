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