import { DOMType, ScrollEventTargetCollection, ScrollEventScopeLimiter } from '@brycemarshall/scroll-listener';
export { DOMType, ScrollEventScopeLimiter } from '@brycemarshall/scroll-listener';

/**
 * The base class for ScrollEventFilter providers. The factory method pattern is intended to make it easy for implementors
 * to return either a singleton ScrollEventFilter instance or create a new instance for each request.
 */
export abstract class ScrollSourceFilterProvider {
    abstract getFilter(): ScrollSourceFilter;
}

/**
 * The default ScrollSourceFilterProvider implementation.
 */
export class DefaultScrollSourceFilterProvider extends ScrollSourceFilterProvider {
    getFilter(): ScrollSourceFilter {
        return new DefaultScrollSourceFilter();
    }
}

/**
 * The base class for all ScrollSourceFilterProvider implementations.
 */
export abstract class ScrollSourceFilter {
    public get filterFunction(): ScrollEventScopeLimiter {
        return (domType: DOMType, eventSource: Element | Document | Window): boolean => { return this.include(domType, eventSource); };
    }

    /**
     * The default ScrollEventScopeLimiter scroll source filter function, implemented here for accessibility by derived classes.
     * @param domType
     * @param eventSource 
     */
    protected defaultFilter(domType: DOMType, eventSource: Element | Document | Window): boolean {
        if (domType == DOMType.Element && (<Element>eventSource).tagName == "APP-ROOT")
            return false;

        return ScrollEventTargetCollection.defaultScopeLimiter(domType, eventSource);
    }

    /**
     * 
     * @param domType When implemented in a derived class, returns true if eventSource is a valid scroll source, otherwise returns false.
     * @param eventSource 
     */
    protected abstract include(domType: DOMType, eventSource: Element | Document | Window): boolean;
}

/**
 * The default ScrollSourceFilter implementation.
 */
export class DefaultScrollSourceFilter extends ScrollSourceFilter {
    /**
     * The default filter function. DefaultScrollSourceFilter simply invokes the protected defaultFilter function of the base ScrollSourceFilter class.
     * @param domType
     * @param eventSource 
     */
    protected include(domType: DOMType, eventSource: Element | Document | Window): boolean {
        return this.defaultFilter(domType, eventSource);
    }
}
