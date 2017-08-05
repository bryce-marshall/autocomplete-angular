import { Component, ViewEncapsulation } from '@angular/core';
import { AutocompleteResolveData, AutocompleteResolveFunction, AutocompleteTypeProvider, AutocompleteTypeset, AutocompleteQueryMediator } from './autocomplete/index';
import { CustomCreate, CustomList } from './custom-autocomplete/custom-autocomplete.module';
import { ColourManager } from './lib/colour-manager';
import { Colour, ColourQueryProvider } from './lib/colour-query-provider';
import { CityQueryProvider } from './lib/city-query-provider';
import { CurrencyQueryProvider } from './lib/currency-query-provider';
import { stringFormat } from '@brycemarshall/string-format';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  encapsulation: ViewEncapsulation.None,
  providers: [AutocompleteTypeProvider]
})
export class AppComponent {
  private _scrollHeight: number;
  private _scrollWidth: number;
  private _colourManager: ColourManager = new ColourManager();
  public openOnFocus = true;
  public autoAssign = "on";
  public allowCreate = true;
  public customCreate = false;
  public customList = false;
  public randomiseTime = false;
  public queryDelay: number = 2000;
  public _scroll: boolean = false;

  constructor(typeProvider: AutocompleteTypeProvider) {
    typeProvider.add("Both", new AutocompleteTypeset(CustomCreate, CustomList));
    typeProvider.add("Create", new AutocompleteTypeset(CustomCreate, null));
    typeProvider.add("List", new AutocompleteTypeset(null, CustomList));
  }

  ngOnInit() {
    window.addEventListener("resize", (e) => {
      this.setScrollRegions();

    });

    this.setScrollRegions();
  }

  setScrollRegions() {
    if (!this.scroll) {
      this._scrollHeight = null;
      this._scrollWidth = null;
    }
    else {
      this._scrollHeight = window.innerHeight;
      this._scrollWidth = window.innerWidth;
      // this.ref.detectChanges();
    }
  }

  get scrollHeight(): number {
    return this._scrollHeight;
  }

  get scrollWidth(): number {
    return this._scrollWidth;
  }  

  get scroll(): boolean {
    return this._scroll;
  }
  set scroll(value: boolean) {
    if (value == this._scroll) return;
    this._scroll = value;
    this.setScrollRegions();
    if (value) {
      setTimeout(() => {
        window.scrollTo(this._scrollWidth, this.scrollHeight);
      }, 200);
      // let e = document.getElementById("scroll-container");
      // e.style.top = this._scrollHeight + "px";
    }
  }

  get queryFn() {
    console.log()
    return (mediator: AutocompleteQueryMediator) => {
      mediator.subscribeFn((sender: AutocompleteQueryMediator, token: any, filter: string) => {
        this.processResult(sender, token, this._colourManager.queryColoursFn(filter));
      });
    }
  }

  get resolveFn() {
    return this._colourManager.resolveColourFn;
  }

  get colour(): Colour {
    return this._colourManager.colour;
  }

  set colour(value: Colour) {
    let alert = value !== this._colourManager.colour;
    this._colourManager.colour = value;
    if (!alert) return;
    this.logAssignment("Colour", value != null ? { name: value.name, rgb: value.rgb } : null, "The colour \"{name}\" having the RGB value {rgb}");
  }

  get typeKey(): string {
    if (this.customCreate && this.customList) return "Both";
    if (this.customCreate) return "Create";
    if (this.customList) return "List";

    return "";
  }

  onSetColour() {
    this._colourManager.nextColour();
  }

  private _city: string = "";
  get queryCitiesFn() {
    return (mediator: AutocompleteQueryMediator) => {
      mediator.subscribeFn((sender: AutocompleteQueryMediator, token: any, filter: string) => {
        this.processResult(sender, token, CityQueryProvider.queryCities(filter));
      });
    }
  }

  get city(): string {
    return this._city;
  }

  set city(value: string) {
    let alert = value !== this._city;
    this._city = value;
    if (!alert) return;
    this.logAssignment("City", value);
  }

  private _currency: any = null;

  get queryCurrenciesFn() {
    return (mediator: AutocompleteQueryMediator) => {
      mediator.subscribeFn((sender: AutocompleteQueryMediator, token: any, filter: string) => {
        this.processResult(sender, token, CurrencyQueryProvider.queryCurrencies(filter));
      });
    }
  }

  get currency(): any {
    return this._currency;
  }

  set currency(value: any) {
    let alert = value !== this._currency;
    this._currency = value;
    if (!alert) return;
    this.logAssignment("Currency", value, "The currency \"{name}\" having the code \"{code}\"");
  }

  get currencyCode(): string {
    return this._currency != null ? this._currency.code : "";
  }

  get formatCurrencyFn() {
    return (item: any, descriptive: boolean): string => {
      if (item == null) return "";
      if (descriptive)
        return item.code + " (" + item.name + ")";

      return item.code;
    };
  }

  get resolveCurrencyFunction(): AutocompleteResolveFunction {
    return (data: AutocompleteResolveData) => {
      let v = data.inputValue.toLowerCase();
      let results = CurrencyQueryProvider.queryCurrencies(v);
      if (results.length == 0) return false;

      for (let c of results) {
        if (c.code.toLowerCase() != v && c.name.toLowerCase() != v) continue;
        data.resolvedValue = c;
        break;
      }
      return data.resolvedValue != null;
    };
  }

  private processResult(sender: AutocompleteQueryMediator, token: any, data: any[]) {
    if (!this.randomiseTime)
      sender.onResult(token, data);
    else {
      setTimeout(() => {
        sender.onResult(token, data);
      }, Math.random() * this.queryDelay);
    }
  }

  private logAssignment(fieldName: string, value: any, message?: string) {
    if (message == null) message = "The value \"{0}\"";
    message = value != null ? stringFormat(message, value) : "A null value";
    console.log(message + stringFormat(" was applied to the \"{0}\" field", fieldName));
  }
}
