import { Vector2 } from 'three';

export class BoundingRect {
    position: Vector2;
    width: number;
    height: number;
    top: number;
    right: number;
    bottom: number;
    left: number;

    constructor(width: number, height: number, x = 0, y = 0) {
        this.width = width;
        this.height = height;
        this.position = new Vector2(x, y);
        this.update();
    }

    update() {
        this.top = this.position.y - this.height / 2;
        this.right = this.position.x + this.width / 2;
        this.bottom = this.position.y + this.height / 2;
        this.left = this.position.x - this.width / 2;
    }
}
