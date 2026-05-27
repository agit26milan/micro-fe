type EventPayload = Record<string, unknown>;

interface MFEEvent<T extends EventPayload = EventPayload> {
  source: string;  // Nama MFE yang emit
  payload: T;
  timestamp: number;
}

class MFEEventBus {
  private listeners = new Map<string, Set<(event: MFEEvent) => void>>();

  emit<T extends EventPayload>(eventName: string, source: string, payload: T) {
    const event: MFEEvent<T> = {
      source,
      payload,
      timestamp: Date.now(),
    };

    // Dispatch sebagai Custom Event di window (cross-framework compatible)
    window.dispatchEvent(
      new CustomEvent(`mfe:${eventName}`, { detail: event, bubbles: true })
    );

    // Juga notify internal listeners
    this.listeners.get(eventName)?.forEach(fn => fn(event));
  }

  on<T extends EventPayload>(
    eventName: string,
    handler: (event: MFEEvent<T>) => void
  ): () => void {
    const wrappedHandler = (e: Event) => {
      handler((e as CustomEvent<MFEEvent<T>>).detail);
    };

    window.addEventListener(`mfe:${eventName}`, wrappedHandler);

    // Return unsubscribe function
    return () => window.removeEventListener(`mfe:${eventName}`, wrappedHandler);
  }
}

// Singleton — tersedia global
export const eventBus = new MFEEventBus();

// Contoh events yang terdefinisi
export const MFE_EVENTS = {
  CART_UPDATED: 'cart:updated',
  USER_LOGGED_IN: 'user:logged_in',
  USER_LOGGED_OUT: 'user:logged_out',
  PRODUCT_VIEWED: 'product:viewed',
  CHECKOUT_STARTED: 'checkout:started',
  CHECKOUT_COMPLETED: 'checkout:completed',
} as const;
