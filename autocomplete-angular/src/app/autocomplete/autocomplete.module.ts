import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AutocompleteStyles } from './autocomplete-styles';
import { Autocomplete, AutocompleteContainer } from './autocomplete';
import { AutocompletePopup, CreateDirective, ListDirective } from './popup/popup';
import { CancelIcon } from './cancel-icon/cancel-icon';

@NgModule({
  declarations: [
    Autocomplete,
    AutocompleteContainer,
    AutocompletePopup, 
    CreateDirective, 
    ListDirective,
    CancelIcon
  ],
  entryComponents:[AutocompletePopup, CancelIcon],
  imports: [
    CommonModule,
  ],
  exports: [
    AutocompleteContainer, Autocomplete
  ]
})
export class AutocompleteModule { }
