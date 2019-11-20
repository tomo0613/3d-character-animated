export class EventListener<EventType extends string|number> {
    private listeners: Map<EventType, Set<Function>> = new Map();

    add(eventType: EventType, listener: Function) {
        if (this.listeners.has(eventType)) {
            const listeners = this.listeners.get(eventType);

            listeners.add(listener);
        } else {
            const listeners = new Set([listener]);

            this.listeners.set(eventType, listeners);
        }
    }

    remove(eventType: EventType, listener: Function) {
        if (this.listeners.has(eventType)) {
            const listeners = this.listeners.get(eventType);

            listeners.delete(listener);

            if (!listeners.size) {
                this.listeners.delete(eventType);
            }
        }
    }

    clear() {
        this.listeners.clear();
    }

    dispatch(eventType: EventType, ...args: any[]) {
        if (this.listeners.has(eventType)) {
            const listeners = this.listeners.get(eventType);

            listeners.forEach((listener) => listener(...args));
        }
    }
}
