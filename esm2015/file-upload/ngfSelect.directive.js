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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmdmU2VsZWN0LmRpcmVjdGl2ZS5qcyIsInNvdXJjZVJvb3QiOiIvVXNlcnMvYWNrZXJhcHBsZS9Qcm9qZWN0cy93ZWIvYW5ndWxhci9hbmd1bGFyLWZpbGUvZGV2ZWxvcG1lbnQvcHJvamVjdHMvYW5ndWxhci1maWxlL3NyYy8iLCJzb3VyY2VzIjpbImZpbGUtdXBsb2FkL25nZlNlbGVjdC5kaXJlY3RpdmUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxFQUFFLFNBQVMsRUFBRSxLQUFLLEVBQUUsTUFBTSxlQUFlLENBQUE7QUFDaEQsT0FBTyxFQUFFLEdBQUcsRUFBRSxNQUFNLGlCQUFpQixDQUFBO0FBTXJDLE1BQU0sT0FBTyxTQUFVLFNBQVEsR0FBRztJQUpsQzs7UUFLVyxlQUFVLEdBQU8sSUFBSSxDQUFBO0lBQ2hDLENBQUM7OztZQU5BLFNBQVMsU0FBQztnQkFDVCxRQUFRLEVBQUUsYUFBYTtnQkFDdkIsUUFBUSxFQUFFLFdBQVc7YUFDdEI7Ozt5QkFFRSxLQUFLIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgRGlyZWN0aXZlLCBJbnB1dCB9IGZyb20gXCJAYW5ndWxhci9jb3JlXCJcbmltcG9ydCB7IG5nZiB9IGZyb20gXCIuL25nZi5kaXJlY3RpdmVcIlxuXG5ARGlyZWN0aXZlKHtcbiAgc2VsZWN0b3I6IFwiW25nZlNlbGVjdF1cIixcbiAgZXhwb3J0QXM6IFwibmdmU2VsZWN0XCJcbn0pXG5leHBvcnQgY2xhc3MgbmdmU2VsZWN0IGV4dGVuZHMgbmdmIHtcbiAgQElucHV0KCkgc2VsZWN0YWJsZTphbnkgPSB0cnVlXG59Il19