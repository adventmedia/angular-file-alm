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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmdmQmFja2dyb3VuZC5kaXJlY3RpdmUuanMiLCJzb3VyY2VSb290IjoiLi4vLi4vcHJvamVjdHMvYW5ndWxhci1maWxlL3NyYy8iLCJzb3VyY2VzIjpbImZpbGUtdXBsb2FkL25nZkJhY2tncm91bmQuZGlyZWN0aXZlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sRUFBRSxTQUFTLEVBQUUsVUFBVSxFQUFFLEtBQUssRUFBRSxNQUFNLGVBQWUsQ0FBQztBQUM3RCxPQUFPLEVBQUUsT0FBTyxFQUFFLE1BQU0sYUFBYSxDQUFDO0FBR3RDLE1BQU0sT0FBTyxhQUFhO0lBR3hCLFlBQW1CLFVBQXFCO1FBQXJCLGVBQVUsR0FBVixVQUFVLENBQVc7SUFBRSxDQUFDO0lBRTNDLFdBQVcsQ0FBRSxRQUFZO1FBQ3ZCLE9BQU8sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDO2FBQ2pCLElBQUksQ0FBQyxHQUFHLENBQUEsRUFBRTtZQUNULE1BQU0sU0FBUyxHQUFHLFFBQVEsR0FBRyxDQUFDLEdBQUcsSUFBSSxFQUFFLENBQUMsR0FBRyxLQUFLLENBQUE7WUFDaEQsSUFBSSxDQUFDLFVBQVUsQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDLGVBQWUsR0FBRyxTQUFTLENBQUE7UUFDakUsQ0FBQyxDQUFDLENBQUE7SUFDSixDQUFDOzs7WUFaRixTQUFTLFNBQUMsRUFBQyxRQUFRLEVBQUUsaUJBQWlCLEVBQUM7OztZQUhwQixVQUFVOzs7bUJBSzNCLEtBQUssU0FBQyxlQUFlIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgRGlyZWN0aXZlLCBFbGVtZW50UmVmLCBJbnB1dCB9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0IHsgZGF0YVVybCB9IGZyb20gJy4vZmlsZVRvb2xzJztcblxuQERpcmVjdGl2ZSh7c2VsZWN0b3I6ICdbbmdmQmFja2dyb3VuZF0nfSlcbmV4cG9ydCBjbGFzcyBuZ2ZCYWNrZ3JvdW5kIHtcbiAgQElucHV0KCduZ2ZCYWNrZ3JvdW5kJykgZmlsZTphbnlcblxuICBjb25zdHJ1Y3RvcihwdWJsaWMgRWxlbWVudFJlZjpFbGVtZW50UmVmKXt9XG5cbiAgbmdPbkNoYW5nZXMoIF9jaGFuZ2VzOmFueSApe1xuICAgIGRhdGFVcmwodGhpcy5maWxlKVxuICAgIC50aGVuKHNyYz0+e1xuICAgICAgY29uc3QgdXJsU3RyaW5nID0gJ3VybChcXCcnICsgKHNyYyB8fCAnJykgKyAnXFwnKSdcbiAgICAgIHRoaXMuRWxlbWVudFJlZi5uYXRpdmVFbGVtZW50LnN0eWxlLmJhY2tncm91bmRJbWFnZSA9IHVybFN0cmluZ1xuICAgIH0pXG4gIH1cbn1cbiJdfQ==