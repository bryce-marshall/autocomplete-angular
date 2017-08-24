import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';

import { AppComponent } from './app.component';
import { AppComponentCities } from './app.component-cities';
import { AppComponentColours } from './app.component-colours';
import { AppComponentCustom } from './app.component-custom';
import { AppComponentAsync } from './app.component-async';
import { TestCompModule } from './test-comp/test-comp.module';
import { AutocompleteModule } from './autocomplete/autocomplete.module';
import { CustomAutocompleteModule } from './custom-autocomplete/custom-autocomplete.module';


@NgModule({
  declarations: [
    AppComponent,
    AppComponentCities,
    AppComponentColours,
    AppComponentCustom,
    AppComponentAsync
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
  // bootstrap: [AppComponent]
  bootstrap: [AppComponentCities]
  //bootstrap: [AppComponentColours]
  // bootstrap: [AppComponentCustom]
  // bootstrap: [AppComponentAsync]
})
export class AppModule { }
