import { Injectable, Optional, SkipSelf } from '@angular/core'
import { ExceptionFactory } from '@brycemarshall/exception'

/**
 * A key/value collection of AutocompleteTypeset instances.
 * @class AutocompleteTypeProvider
 */
@Injectable()
export class AutocompleteTypeProvider {
    /** @internal */
    private _d: { [key: string]: AutocompleteTypeset } = {};

    /**
     * Creates a new instance of the AutocompleteTypeset class.
     * @constructor
     * The AutocompleteTypeProvider instance defined in a parent scope (if any).
     * @param {AutocompleteTypeProvider} _parent
     */
    constructor( @Optional() @SkipSelf() private _parent: AutocompleteTypeProvider) {
    }

    /**
     * Adds an AutocompleteTypeset instance to the collection.
     * @method add
     * @param {string} key The unique key identifying the AutocompleteTypeset instance within the collection.
     * @param {string} typeset The AutocompleteTypeset instance to add.
     */
    add(key: string, typeset: AutocompleteTypeset) {
        if (key == null) throw ExceptionFactory.ArgumentNull("key");
        if (typeset == null) throw ExceptionFactory.ArgumentNull("typeset");
        if (this[key] != null)
            throw ExceptionFactory.InvalidOperation('A provider corresponding to the key "{0}" already exists in the AutocompleteTypeProvider.', key)
        this._d[key] = typeset;
    }

    /**
     * Retrieves an AutocompleteTypeset instance from the collection.
     * @method get
     * @param {string} key The unique key identifying the AutocompleteTypeset instance to retrieve.
     * @returns The resolved AutocompleteTypeset instance.
     * @throws Throws InvalidOperation error if key does not exist within the collection.
     */
    get(key: string): AutocompleteTypeset {
        if (key == null) throw ExceptionFactory.ArgumentNull("key");
        let result = this._d[key];
        if (result) return result;
        if (!this._parent) throw ExceptionFactory.InvalidOperation('No provider corresponding to the key "{0}" exists in the AutocompleteTypeProvider.', key)
        return this._parent.get(key);
    }

    /**
     * Retrieves an AutocompleteTypeset instance from the collection, or a specified default value if key does not exist.
     * @method get
     * @param {string} key The key uniquely identifying the AutocompleteTypeset instance to retrieve.
     * @param {string} defaultTypeset Optional. The value to return if key does not exist within the collection.
     * @returns The resolved AutocompleteTypeset instance, or defaultTypeset if key does not exist.
     */
    tryGet(key: string, defaultTypeset?: AutocompleteTypeset): AutocompleteTypeset {
        if (key == null) throw ExceptionFactory.ArgumentNull("key");
        let result = this._d[key];
        if (result) return result;
        if (!this._parent)
            return defaultTypeset;
        return this._parent.tryGet(key, defaultTypeset);
    }

    /**
     * Removes the AutocompleteTypeset identified by key from the collection.
     * @method remove
     * @param {string} key The key uniquely identifying the AutocompleteTypeset instance to remove.
     * @returns The removed AutocompleteTypeset instance.
     * @throws Throws InvalidOperation error if key does not exist within the collection.
     */
    remove(key: string): AutocompleteTypeset {
        let result = this.get(key);
        this._d[key] = null;
        return result;
    }

    /**
     * Evaluates whether or not key exists within the collection.
     * @method has
     * @returns The true if key exists within the collection; otherwise returns false.
     */
    has(key: string): boolean {
        if (key == null) throw ExceptionFactory.ArgumentNull("key");
        return this[key] != null;
    }

    /**
     * Evaluates whether or not key exists within this collection or that of a parent scope.
     * @method canResolve
     * @returns The true if key exists within this collection or that of a parent scope; otherwise returns false.
     */
    canResolve(key: string): boolean {
        if (key == null) throw ExceptionFactory.ArgumentNull("key");
        if (this[key] != null) return true;
        return this._parent != null ? this._parent.canResolve(key) : false;
    }
}

/**
 * Exposes custom Autocomplete popup sub-components.
 * @class AutocompleteTypeset
 */
export class AutocompleteTypeset {
    /** @internal */
    private _createType: any;
    /** @internal */
    private _listType: any;

    /**
     * Creates a new instance of the AutocompleteTypeset class.
     * @constructor
     * @param {any} createType A component type that implements IAutocompleteCreateComponent.
     * Pass null to fallback to that defined by a parent scope (or to the default if no parent definition exists).
     * @param {any} listType A component type that implements IAutocompleteListComponent.
     * Pass null to fallback to that defined by a parent scope (or to the default if no parent definition exists).
     */
    constructor(createType: any, listType: any) {
        this._createType = createType;
        this._listType = listType;
    }

    /**
     * The custom create component type (if any) represented by this instance.
     * @property {any} createType
     */
    get createType(): any {
        return this._createType;
    }

    /**
     * The custom list component type (if any) represented by this instance.
     * @property {any} listType
     */
    get listType(): any {
        return this._listType;
    }
}
