export default class ObjectPool<ObjectType> {
    activeCount = 0;
    items: ObjectType[];

    constructor(itemCount: number, ObjectConstructor /* : new ObjectType */, defaultParams: any[]) {
        this.items = Array.from({ length: itemCount }).map(() => new ObjectConstructor(...defaultParams));
    }

    /**
     * get the first inactive item
     */
    obtain = () => {
        if (this.activeCount >= this.items.length) {
            return null; // ToDo
        }
        return this.items[this.activeCount++];
    }

    /**
     * replace the current item with the last active
     */
    release = (item: ObjectType) => {
        this.activeCount--;

        const index = this.items.indexOf(item);
        const lastActive = this.items[this.activeCount];

        if (item === lastActive) {
            return;
        }

        this.items[this.activeCount] = this.items[index];
        this.items[index] = lastActive;
    }
}
