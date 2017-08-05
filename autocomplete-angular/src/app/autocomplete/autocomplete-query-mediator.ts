

/**
 * A function that is assigned to an Autocomplete directive instance (via its associated input control) to bind a query processor
 * to the active AutocompleteQueryMediator instance.
 * 
 * Remarks:
 * 
 * The Observer-type pattern inherent in the BindQueryProcessorFunction design was chosen (as opposed to a function to be invoked each time the 
 * Autocomplete input changed) because it gives query implementors greater flexibility when managing the scope and lifecycle of underlying query resources
 * (see also the documentation for the AutocompleteQueryMediator interface).
 * @type BindQueryProcessorFunction
 */
export type BindQueryProcessorFunction = (mediator: AutocompleteQueryMediator) => void;

/**
 *
 * @type InputChangedFunction
 */
export type InputChangedFunction = (sender: AutocompleteQueryMediator, token: any, filter: string) => void;

/**
 * Implements input state change and lifecycle management methods for an object that performs autocomplete queries
 * (see also the documentation for the AutocompleteQueryMediator interface).
 * @interface AutocompleteQueryProcessor
 */
export interface AutocompleteQueryProcessor {
    /**
     * Invoked by the Autocomplete framework in response to changes to the underlying input control.
     * In response, the query processor implementation should (either synchronously or asynchronously) initiate a query for autocomplete suggestion items,
     * and update the Autocomplete control by invoking sender.updateResult(items).
     * 
     * Note: The sender parameter is passed to the onInputChanged method as a convenience (doing so means that it is not necessary for client code to
     * maintain AutocompleteQueryMediator state) however the same AutocompleteQueryMediator instance will first have been passed to the 
     * Autocomplete instance's associated BindQueryProcessorFunction.
     */
    onInputChanged(sender: AutocompleteQueryMediator, token: any, filter: string);
    /**
     * Invoked by the Autocomplete framework when auto-complete resources are being released from the active input control (which typically occurs when it loses focus).
     * This method provides an opportunity for a query processor to release any of its own open resources.
     */
    onDestroy();
}

/**
 * Mediates interaction between the Autocomplete input control and the query processor that retrieves its dynamic list of auto-complete suggestion items.
 * AutocompleteQueryMediator forwards input changes to a registered handler function 
 * (or optionally to a registered object implementing the AutocompleteQueryProcessor processor interface), 
 * and allows the handler to return the query results in its own time (synchronously or asynchronously). 
 * 
 * An AutocompleteQueryMediator is created after an Autocomplete input control received focus and immediately before it makes its first query request 
 * for auto-complete suggestions, and the same instance is used for all subsequent query requests made by the same control instance before 
 * being destroyed when the input control loses focus.
 * 
 * Remarks:
 * 
 * AutocompleteQueryMediator can be thought to implement a kind of reciprocal observer pattern, with the query processor subscribing to 
 * Autocomplete input change events and the Autocomplete framework subscribing to query updates.
 * @interface AutocompleteQueryMediator
 */
export interface AutocompleteQueryMediator {
    /**
     * Returns true if the AutocompleteQueryMediator instance has been destroyed by the Autocomplete resource manager, otherwise returns false.
     */
    readonly isDestroyed: boolean;
    /**
     * Invoked by the Autocomplete input control's associated BindQueryProcessorFunction to subscribe to input changed and (optionally) destroy events
     * via function references.
     * 
     * This method will raise an error if either the subcribeFn or the suscbribeProc methods have previously been invoked.
     */
    subscribeFn(inputChangedFn: InputChangedFunction, destroyFn?: Function);
    /**
     * Invoked by the Autocomplete input control's associated BindQueryProcessorFunction to subscribe to input changed and destroy events via 
     * an object implementing the AutocompleteQueryProcessor interface.
     * 
     * This method will raise an error if either the subcribeFn or the suscbribeProc methods have previously been invoked.
     */
    subscribeProc(processor: AutocompleteQueryProcessor);
    /**
     * The method invoked by a query processing implementation to update the active Autocomplete control with query results.
     * 
     * Remarks: 
     * 
     * It is not mandatory for onResult to be invoked in response to every input changed event (although the query processor SHOULD 
     * pass either a null value or an empty array to indicate an empty result set); a query processor implementation MAY elect to arbitrarily ignore
     * some or all input changes.
     * 
     * It is safe to invoke onResult even after the AutocompleteQueryMediator instance has been destroyed as the invocation will simply be ignored.
     */
    onResult(token: any, items: any[]);
}