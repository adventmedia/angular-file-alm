import { Directive, ElementRef, Input } from '@angular/core';
import { dataUrl } from './fileTools';
export class ngfSrc {
    constructor(ElementRef) {
        this.ElementRef = ElementRef;
    }
    ngOnChanges(_changes) {
        dataUrl(this.file)
            .then(src => this.ElementRef.nativeElement.src = src);
    }
}
ngfSrc.decorators = [
    { type: Directive, args: [{ selector: '[ngfSrc]' },] }
];
ngfSrc.ctorParameters = () => [
    { type: ElementRef }
];
ngfSrc.propDecorators = {
    file: [{ type: Input, args: ['ngfSrc',] }]
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmdmU3JjLmRpcmVjdGl2ZS5qcyIsInNvdXJjZVJvb3QiOiIvVXNlcnMvYWNrZXJhcHBsZS9Qcm9qZWN0cy93ZWIvYW5ndWxhci9hbmd1bGFyLWZpbGUvZGV2ZWxvcG1lbnQvcHJvamVjdHMvYW5ndWxhci1maWxlL3NyYy8iLCJzb3VyY2VzIjpbImZpbGUtdXBsb2FkL25nZlNyYy5kaXJlY3RpdmUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxFQUFFLFNBQVMsRUFBRSxVQUFVLEVBQUUsS0FBSyxFQUFFLE1BQU0sZUFBZSxDQUFDO0FBQzdELE9BQU8sRUFBRSxPQUFPLEVBQUUsTUFBTSxhQUFhLENBQUM7QUFHdEMsTUFBTSxPQUFPLE1BQU07SUFHakIsWUFBbUIsVUFBc0I7UUFBdEIsZUFBVSxHQUFWLFVBQVUsQ0FBWTtJQUFJLENBQUM7SUFFOUMsV0FBVyxDQUFDLFFBQWE7UUFDdkIsT0FBTyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUM7YUFDakIsSUFBSSxDQUFDLEdBQUcsQ0FBQSxFQUFFLENBQ1QsSUFBSSxDQUFDLFVBQVUsQ0FBQyxhQUFhLENBQUMsR0FBRyxHQUFHLEdBQUcsQ0FDeEMsQ0FBQTtJQUNILENBQUM7OztZQVhGLFNBQVMsU0FBQyxFQUFFLFFBQVEsRUFBRSxVQUFVLEVBQUU7OztZQUhmLFVBQVU7OzttQkFLM0IsS0FBSyxTQUFDLFFBQVEiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBEaXJlY3RpdmUsIEVsZW1lbnRSZWYsIElucHV0IH0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQgeyBkYXRhVXJsIH0gZnJvbSAnLi9maWxlVG9vbHMnO1xuXG5ARGlyZWN0aXZlKHsgc2VsZWN0b3I6ICdbbmdmU3JjXScgfSlcbmV4cG9ydCBjbGFzcyBuZ2ZTcmMge1xuICBASW5wdXQoJ25nZlNyYycpIGZpbGU6IGFueVxuXG4gIGNvbnN0cnVjdG9yKHB1YmxpYyBFbGVtZW50UmVmOiBFbGVtZW50UmVmKSB7IH1cblxuICBuZ09uQ2hhbmdlcyhfY2hhbmdlczogYW55KSB7XG4gICAgZGF0YVVybCh0aGlzLmZpbGUpXG4gICAgLnRoZW4oc3JjPT5cbiAgICAgIHRoaXMuRWxlbWVudFJlZi5uYXRpdmVFbGVtZW50LnNyYyA9IHNyY1xuICAgIClcbiAgfVxufVxuIl19