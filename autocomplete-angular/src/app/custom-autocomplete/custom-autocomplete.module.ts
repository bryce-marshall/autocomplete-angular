import { NgModule } from '@angular/core';
//import { BrowserModule } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
// import { IonicPageModule } from 'ionic-angular';
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
//   imports: [
//     IonicPageModule.forChild(CustomCreate),
//     IonicPageModule.forChild(CustomList)
//   ],
  exports: [
    CustomCreate,
    CustomList
  ]
})
export class CustomAutocompleteModule {}
