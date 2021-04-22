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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmdmU3JjLmRpcmVjdGl2ZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9maWxlLXVwbG9hZC9uZ2ZTcmMuZGlyZWN0aXZlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sRUFBRSxTQUFTLEVBQUUsVUFBVSxFQUFFLEtBQUssRUFBRSxNQUFNLGVBQWUsQ0FBQztBQUM3RCxPQUFPLEVBQUUsT0FBTyxFQUFFLE1BQU0sYUFBYSxDQUFDO0FBR3RDLE1BQU0sT0FBTyxNQUFNO0lBR2pCLFlBQW1CLFVBQXNCO1FBQXRCLGVBQVUsR0FBVixVQUFVLENBQVk7SUFBSSxDQUFDO0lBRTlDLFdBQVcsQ0FBQyxRQUFhO1FBQ3ZCLE9BQU8sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDO2FBQ2pCLElBQUksQ0FBQyxHQUFHLENBQUEsRUFBRSxDQUNULElBQUksQ0FBQyxVQUFVLENBQUMsYUFBYSxDQUFDLEdBQUcsR0FBRyxHQUFHLENBQ3hDLENBQUE7SUFDSCxDQUFDOzs7WUFYRixTQUFTLFNBQUMsRUFBRSxRQUFRLEVBQUUsVUFBVSxFQUFFOzs7WUFIZixVQUFVOzs7bUJBSzNCLEtBQUssU0FBQyxRQUFRIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgRGlyZWN0aXZlLCBFbGVtZW50UmVmLCBJbnB1dCB9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0IHsgZGF0YVVybCB9IGZyb20gJy4vZmlsZVRvb2xzJztcblxuQERpcmVjdGl2ZSh7IHNlbGVjdG9yOiAnW25nZlNyY10nIH0pXG5leHBvcnQgY2xhc3MgbmdmU3JjIHtcbiAgQElucHV0KCduZ2ZTcmMnKSBmaWxlOiBhbnlcblxuICBjb25zdHJ1Y3RvcihwdWJsaWMgRWxlbWVudFJlZjogRWxlbWVudFJlZikgeyB9XG5cbiAgbmdPbkNoYW5nZXMoX2NoYW5nZXM6IGFueSkge1xuICAgIGRhdGFVcmwodGhpcy5maWxlKVxuICAgIC50aGVuKHNyYz0+XG4gICAgICB0aGlzLkVsZW1lbnRSZWYubmF0aXZlRWxlbWVudC5zcmMgPSBzcmNcbiAgICApXG4gIH1cbn1cbiJdfQ==