import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CustomCreate } from './custom-create';
import { CustomList } from './custom-list';
export { CustomCreate } from './custom-create';
export { CustomList } from './custom-list';

@NgModule({
  declarations: [
    CustomCreate,
    CustomList
  ],
  imports: [
    CommonModule
  ],
  entryComponents:[CustomCreate, CustomList],  
  exports: [
    CustomCreate,
    CustomList
  ]
})
export class CustomAutocompleteModule {}
