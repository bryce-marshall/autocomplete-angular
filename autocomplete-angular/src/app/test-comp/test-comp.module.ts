import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';
import { TestCompComponent } from './test-comp.component';

@NgModule({
  declarations: [
    TestCompComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    HttpModule
  ],
  exports: [TestCompComponent],
  providers: [],
})
export class TestCompModule { }
