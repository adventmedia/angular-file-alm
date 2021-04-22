import { Directive, Input } from "@angular/core";
import { ngf } from "./ngf.directive";
export class ngfSelect extends ngf {
    constructor() {
        super(...arguments);
        this.selectable = true;
    }
}
ngfSelect.decorators = [
    { type: Directive, args: [{
                selector: "[ngfSelect]",
                exportAs: "ngfSelect"
            },] }
];
ngfSelect.propDecorators = {
    selectable: [{ type: Input }]
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmdmU2VsZWN0LmRpcmVjdGl2ZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9maWxlLXVwbG9hZC9uZ2ZTZWxlY3QuZGlyZWN0aXZlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sRUFBRSxTQUFTLEVBQUUsS0FBSyxFQUFFLE1BQU0sZUFBZSxDQUFBO0FBQ2hELE9BQU8sRUFBRSxHQUFHLEVBQUUsTUFBTSxpQkFBaUIsQ0FBQTtBQU1yQyxNQUFNLE9BQU8sU0FBVSxTQUFRLEdBQUc7SUFKbEM7O1FBS1csZUFBVSxHQUFPLElBQUksQ0FBQTtJQUNoQyxDQUFDOzs7WUFOQSxTQUFTLFNBQUM7Z0JBQ1QsUUFBUSxFQUFFLGFBQWE7Z0JBQ3ZCLFFBQVEsRUFBRSxXQUFXO2FBQ3RCOzs7eUJBRUUsS0FBSyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IERpcmVjdGl2ZSwgSW5wdXQgfSBmcm9tIFwiQGFuZ3VsYXIvY29yZVwiXG5pbXBvcnQgeyBuZ2YgfSBmcm9tIFwiLi9uZ2YuZGlyZWN0aXZlXCJcblxuQERpcmVjdGl2ZSh7XG4gIHNlbGVjdG9yOiBcIltuZ2ZTZWxlY3RdXCIsXG4gIGV4cG9ydEFzOiBcIm5nZlNlbGVjdFwiXG59KVxuZXhwb3J0IGNsYXNzIG5nZlNlbGVjdCBleHRlbmRzIG5nZiB7XG4gIEBJbnB1dCgpIHNlbGVjdGFibGU6YW55ID0gdHJ1ZVxufSJdfQ==