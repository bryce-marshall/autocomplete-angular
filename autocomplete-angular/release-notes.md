# 1.0.4
## Added persistent parameter to AutocompleteBase.setControlValue abstract method
Allows subclasses to prevent non-persistent values (in this case those set as a consequence of cursor navigation) from being passed-up to encapsulating types.
Necessary for the cursor function to work correctly on the Ionic implementation.
# 1.0.3
## Suppress Escape Keyboard Events
Suppress bubbling of the keyup and keydown events when the escape key is a pressed to:
1. Cancel a cursor selection;
2. Close the popup; or
3. Cancel an edit (reset the input control to its pre-focused value)

## onAfterSetDataItem abstract method added to AutocompleteBase
Invoked after the dataItem property has been set.
This method exists to support the Autocomplete Ionic implementation