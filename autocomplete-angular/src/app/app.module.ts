import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';

import { AppComponent } from './app.component';
import { TestCompModule } from './test-comp/test-comp.module';
import { AutocompleteModule } from './autocomplete/autocomplete.module';
import { CustomAutocompleteModule } from './custom-autocomplete/custom-autocomplete.module';
import { AutocompleteStyles } from './autocomplete/index';

@NgModule({
  declarations: [
    AppComponent,
    AutocompleteStyles
  ],
  imports: [
    BrowserModule,
    FormsModule,
    HttpModule,
    TestCompModule,
    AutocompleteModule,
    CustomAutocompleteModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
