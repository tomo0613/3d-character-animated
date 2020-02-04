export interface PoolItem {
    active: boolean;
}

export default class ObjectPool<O extends PoolItem> {
    items: O[];
    activeCount = 0;

    constructor(itemCount: number, ObjectConstructor: new (...args: any[]) => O, defaultParams: any[] = []) {
        this.items = Array.from({ length: itemCount }).map(() => {
            const item = new ObjectConstructor(...defaultParams);
            item.active = false;

            return item;
        });
    }

    /**
     * get the first inactive item
     */
    obtain = () => {
        if (this.activeCount >= this.items.length) {
            throw new Error('ObjectPool->obtain() no more inactive items.');
        }
        const item = this.items[this.activeCount++];
        item.active = true;

        return item;
    }

    /**
     * replace the current item with the last active, if it is not last
     */
    release = (item: O) => {
        if (item.active === false) {
            throw new Error(`ObjectPool->release($item) Not active $item: ${JSON.stringify(item)}`);
        }
        this.activeCount--;
        item.active = false;

        if (!this.activeCount) {
            return;
        }

        const index = this.items.indexOf(item);
        const lastActive = this.items[this.activeCount];

        if (index < 0) {
            throw new Error(`ObjectPool->release($item) Not valid $item: ${JSON.stringify(item)}`);
        }
        if (item === lastActive) {
            return;
        }

        this.items[this.activeCount] = this.items[index];
        this.items[index] = lastActive;
    }

    forActive = (callback: (item: O) => void) => {
        for (let i = this.activeCount - 1; i >= 0; i--) {
            callback.call(this, this.items[i]);
        }
    }
}
