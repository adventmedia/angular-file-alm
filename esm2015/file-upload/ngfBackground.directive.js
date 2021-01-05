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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmdmQmFja2dyb3VuZC5kaXJlY3RpdmUuanMiLCJzb3VyY2VSb290IjoiLi4vLi4vc3JjLyIsInNvdXJjZXMiOlsiZmlsZS11cGxvYWQvbmdmQmFja2dyb3VuZC5kaXJlY3RpdmUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxFQUFFLFNBQVMsRUFBRSxVQUFVLEVBQUUsS0FBSyxFQUFFLE1BQU0sZUFBZSxDQUFDO0FBQzdELE9BQU8sRUFBRSxPQUFPLEVBQUUsTUFBTSxhQUFhLENBQUM7QUFHdEMsTUFBTSxPQUFPLGFBQWE7SUFHeEIsWUFBbUIsVUFBcUI7UUFBckIsZUFBVSxHQUFWLFVBQVUsQ0FBVztJQUFFLENBQUM7SUFFM0MsV0FBVyxDQUFFLFFBQVk7UUFDdkIsT0FBTyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUM7YUFDakIsSUFBSSxDQUFDLEdBQUcsQ0FBQSxFQUFFO1lBQ1QsTUFBTSxTQUFTLEdBQUcsUUFBUSxHQUFHLENBQUMsR0FBRyxJQUFJLEVBQUUsQ0FBQyxHQUFHLEtBQUssQ0FBQTtZQUNoRCxJQUFJLENBQUMsVUFBVSxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUMsZUFBZSxHQUFHLFNBQVMsQ0FBQTtRQUNqRSxDQUFDLENBQUMsQ0FBQTtJQUNKLENBQUM7OztZQVpGLFNBQVMsU0FBQyxFQUFDLFFBQVEsRUFBRSxpQkFBaUIsRUFBQzs7O1lBSHBCLFVBQVU7OzttQkFLM0IsS0FBSyxTQUFDLGVBQWUiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBEaXJlY3RpdmUsIEVsZW1lbnRSZWYsIElucHV0IH0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQgeyBkYXRhVXJsIH0gZnJvbSAnLi9maWxlVG9vbHMnO1xuXG5ARGlyZWN0aXZlKHtzZWxlY3RvcjogJ1tuZ2ZCYWNrZ3JvdW5kXSd9KVxuZXhwb3J0IGNsYXNzIG5nZkJhY2tncm91bmQge1xuICBASW5wdXQoJ25nZkJhY2tncm91bmQnKSBmaWxlOmFueVxuXG4gIGNvbnN0cnVjdG9yKHB1YmxpYyBFbGVtZW50UmVmOkVsZW1lbnRSZWYpe31cblxuICBuZ09uQ2hhbmdlcyggX2NoYW5nZXM6YW55ICl7XG4gICAgZGF0YVVybCh0aGlzLmZpbGUpXG4gICAgLnRoZW4oc3JjPT57XG4gICAgICBjb25zdCB1cmxTdHJpbmcgPSAndXJsKFxcJycgKyAoc3JjIHx8ICcnKSArICdcXCcpJ1xuICAgICAgdGhpcy5FbGVtZW50UmVmLm5hdGl2ZUVsZW1lbnQuc3R5bGUuYmFja2dyb3VuZEltYWdlID0gdXJsU3RyaW5nXG4gICAgfSlcbiAgfVxufVxuIl19