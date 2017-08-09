import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AutocompleteStyles, AutocompleteStylesBackCompat } from './autocomplete-styles';
import { Autocomplete, AutocompleteContainer } from './autocomplete';
import { AutocompletePopup, CreateDirective, ListDirective } from './popup/popup';
import { CancelIcon } from './cancel-icon/cancel-icon';

/**
 * The module for the Angular Autocomplete input directive and associated components.
 */
@NgModule({
  declarations: [
    AutocompleteStyles,
    AutocompleteStylesBackCompat,
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
    AutocompleteStyles, AutocompleteStylesBackCompat, AutocompleteContainer, Autocomplete
  ]
})
export class AutocompleteModule { }
