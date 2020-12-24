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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmdmU3JjLmRpcmVjdGl2ZS5qcyIsInNvdXJjZVJvb3QiOiIuLi8uLi9wcm9qZWN0cy9hbmd1bGFyLWZpbGUvc3JjLyIsInNvdXJjZXMiOlsiZmlsZS11cGxvYWQvbmdmU3JjLmRpcmVjdGl2ZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLEVBQUUsU0FBUyxFQUFFLFVBQVUsRUFBRSxLQUFLLEVBQUUsTUFBTSxlQUFlLENBQUM7QUFDN0QsT0FBTyxFQUFFLE9BQU8sRUFBRSxNQUFNLGFBQWEsQ0FBQztBQUd0QyxNQUFNLE9BQU8sTUFBTTtJQUdqQixZQUFtQixVQUFzQjtRQUF0QixlQUFVLEdBQVYsVUFBVSxDQUFZO0lBQUksQ0FBQztJQUU5QyxXQUFXLENBQUMsUUFBYTtRQUN2QixPQUFPLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQzthQUNqQixJQUFJLENBQUMsR0FBRyxDQUFBLEVBQUUsQ0FDVCxJQUFJLENBQUMsVUFBVSxDQUFDLGFBQWEsQ0FBQyxHQUFHLEdBQUcsR0FBRyxDQUN4QyxDQUFBO0lBQ0gsQ0FBQzs7O1lBWEYsU0FBUyxTQUFDLEVBQUUsUUFBUSxFQUFFLFVBQVUsRUFBRTs7O1lBSGYsVUFBVTs7O21CQUszQixLQUFLLFNBQUMsUUFBUSIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IERpcmVjdGl2ZSwgRWxlbWVudFJlZiwgSW5wdXQgfSBmcm9tICdAYW5ndWxhci9jb3JlJztcbmltcG9ydCB7IGRhdGFVcmwgfSBmcm9tICcuL2ZpbGVUb29scyc7XG5cbkBEaXJlY3RpdmUoeyBzZWxlY3RvcjogJ1tuZ2ZTcmNdJyB9KVxuZXhwb3J0IGNsYXNzIG5nZlNyYyB7XG4gIEBJbnB1dCgnbmdmU3JjJykgZmlsZTogYW55XG5cbiAgY29uc3RydWN0b3IocHVibGljIEVsZW1lbnRSZWY6IEVsZW1lbnRSZWYpIHsgfVxuXG4gIG5nT25DaGFuZ2VzKF9jaGFuZ2VzOiBhbnkpIHtcbiAgICBkYXRhVXJsKHRoaXMuZmlsZSlcbiAgICAudGhlbihzcmM9PlxuICAgICAgdGhpcy5FbGVtZW50UmVmLm5hdGl2ZUVsZW1lbnQuc3JjID0gc3JjXG4gICAgKVxuICB9XG59XG4iXX0=