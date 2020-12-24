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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmdmU2VsZWN0LmRpcmVjdGl2ZS5qcyIsInNvdXJjZVJvb3QiOiIuLi8uLi9wcm9qZWN0cy9hbmd1bGFyLWZpbGUvc3JjLyIsInNvdXJjZXMiOlsiZmlsZS11cGxvYWQvbmdmU2VsZWN0LmRpcmVjdGl2ZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLEVBQUUsU0FBUyxFQUFFLEtBQUssRUFBRSxNQUFNLGVBQWUsQ0FBQTtBQUNoRCxPQUFPLEVBQUUsR0FBRyxFQUFFLE1BQU0saUJBQWlCLENBQUE7QUFNckMsTUFBTSxPQUFPLFNBQVUsU0FBUSxHQUFHO0lBSmxDOztRQUtXLGVBQVUsR0FBTyxJQUFJLENBQUE7SUFDaEMsQ0FBQzs7O1lBTkEsU0FBUyxTQUFDO2dCQUNULFFBQVEsRUFBRSxhQUFhO2dCQUN2QixRQUFRLEVBQUUsV0FBVzthQUN0Qjs7O3lCQUVFLEtBQUsiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBEaXJlY3RpdmUsIElucHV0IH0gZnJvbSBcIkBhbmd1bGFyL2NvcmVcIlxuaW1wb3J0IHsgbmdmIH0gZnJvbSBcIi4vbmdmLmRpcmVjdGl2ZVwiXG5cbkBEaXJlY3RpdmUoe1xuICBzZWxlY3RvcjogXCJbbmdmU2VsZWN0XVwiLFxuICBleHBvcnRBczogXCJuZ2ZTZWxlY3RcIlxufSlcbmV4cG9ydCBjbGFzcyBuZ2ZTZWxlY3QgZXh0ZW5kcyBuZ2Yge1xuICBASW5wdXQoKSBzZWxlY3RhYmxlOmFueSA9IHRydWVcbn0iXX0=