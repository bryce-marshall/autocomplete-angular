# 1.0.3
## Suppress Escape Keyboard Events
Suppress bubbling of the keyup and keydown events when the escape key is a pressed to:
1. Cancel a cursor selection;
2. Close the popup; or
3. Cancel an edit (reset the input control to its pre-focused value)

## onAfterSetDataItem abstract method added to AutocompleteBase
Invoked after the dataItem property has been set.
This method exists to support the Autocomplete Ionic implementation