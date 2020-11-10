import { Directive, ElementRef, Input } from '@angular/core';
import { dataUrl } from './fileTools';
export class ngfBackground {
    constructor(ElementRef) {
        this.ElementRef = ElementRef;
    }
    ngOnChanges(_changes) {
        dataUrl(this.file)
            .then(src => {
            const urlString = 'url(\'' + (src || '') + '\')';
            this.ElementRef.nativeElement.style.backgroundImage = urlString;
        });
    }
}
ngfBackground.decorators = [
    { type: Directive, args: [{ selector: '[ngfBackground]' },] }
];
ngfBackground.ctorParameters = () => [
    { type: ElementRef }
];
ngfBackground.propDecorators = {
    file: [{ type: Input, args: ['ngfBackground',] }]
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmdmQmFja2dyb3VuZC5kaXJlY3RpdmUuanMiLCJzb3VyY2VSb290IjoiL1VzZXJzL2Fja2VyYXBwbGUvUHJvamVjdHMvd2ViL2FuZ3VsYXIvYW5ndWxhci1maWxlL2RldmVsb3BtZW50L3Byb2plY3RzL2FuZ3VsYXItZmlsZS9zcmMvIiwic291cmNlcyI6WyJmaWxlLXVwbG9hZC9uZ2ZCYWNrZ3JvdW5kLmRpcmVjdGl2ZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLEVBQUUsU0FBUyxFQUFFLFVBQVUsRUFBRSxLQUFLLEVBQUUsTUFBTSxlQUFlLENBQUM7QUFDN0QsT0FBTyxFQUFFLE9BQU8sRUFBRSxNQUFNLGFBQWEsQ0FBQztBQUd0QyxNQUFNLE9BQU8sYUFBYTtJQUd4QixZQUFtQixVQUFxQjtRQUFyQixlQUFVLEdBQVYsVUFBVSxDQUFXO0lBQUUsQ0FBQztJQUUzQyxXQUFXLENBQUUsUUFBWTtRQUN2QixPQUFPLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQzthQUNqQixJQUFJLENBQUMsR0FBRyxDQUFBLEVBQUU7WUFDVCxNQUFNLFNBQVMsR0FBRyxRQUFRLEdBQUcsQ0FBQyxHQUFHLElBQUksRUFBRSxDQUFDLEdBQUcsS0FBSyxDQUFBO1lBQ2hELElBQUksQ0FBQyxVQUFVLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQyxlQUFlLEdBQUcsU0FBUyxDQUFBO1FBQ2pFLENBQUMsQ0FBQyxDQUFBO0lBQ0osQ0FBQzs7O1lBWkYsU0FBUyxTQUFDLEVBQUMsUUFBUSxFQUFFLGlCQUFpQixFQUFDOzs7WUFIcEIsVUFBVTs7O21CQUszQixLQUFLLFNBQUMsZUFBZSIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IERpcmVjdGl2ZSwgRWxlbWVudFJlZiwgSW5wdXQgfSBmcm9tICdAYW5ndWxhci9jb3JlJztcbmltcG9ydCB7IGRhdGFVcmwgfSBmcm9tICcuL2ZpbGVUb29scyc7XG5cbkBEaXJlY3RpdmUoe3NlbGVjdG9yOiAnW25nZkJhY2tncm91bmRdJ30pXG5leHBvcnQgY2xhc3MgbmdmQmFja2dyb3VuZCB7XG4gIEBJbnB1dCgnbmdmQmFja2dyb3VuZCcpIGZpbGU6YW55XG5cbiAgY29uc3RydWN0b3IocHVibGljIEVsZW1lbnRSZWY6RWxlbWVudFJlZil7fVxuXG4gIG5nT25DaGFuZ2VzKCBfY2hhbmdlczphbnkgKXtcbiAgICBkYXRhVXJsKHRoaXMuZmlsZSlcbiAgICAudGhlbihzcmM9PntcbiAgICAgIGNvbnN0IHVybFN0cmluZyA9ICd1cmwoXFwnJyArIChzcmMgfHwgJycpICsgJ1xcJyknXG4gICAgICB0aGlzLkVsZW1lbnRSZWYubmF0aXZlRWxlbWVudC5zdHlsZS5iYWNrZ3JvdW5kSW1hZ2UgPSB1cmxTdHJpbmdcbiAgICB9KVxuICB9XG59XG4iXX0=