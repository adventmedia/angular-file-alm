import { Directive, EventEmitter, Output, Input } from '@angular/core';
export class ngfUploadStatus {
    constructor() {
        this.percent = 0;
        this.percentChange = new EventEmitter();
    }
    ngOnChanges(changes) {
        if (changes.httpEvent && changes.httpEvent.currentValue) {
            const event = changes.httpEvent.currentValue;
            if (event.loaded && event.total) {
                setTimeout(() => {
                    this.percent = Math.round(100 * event.loaded / event.total);
                    this.percentChange.emit(this.percent);
                }, 0);
            }
        }
    }
}
ngfUploadStatus.decorators = [
    { type: Directive, args: [{ selector: 'ngfUploadStatus' },] }
];
ngfUploadStatus.propDecorators = {
    percent: [{ type: Input }],
    percentChange: [{ type: Output }],
    httpEvent: [{ type: Input }]
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmdmVXBsb2FkU3RhdHVzLmRpcmVjdGl2ZS5qcyIsInNvdXJjZVJvb3QiOiIuLi8uLi9wcm9qZWN0cy9hbmd1bGFyLWZpbGUvc3JjLyIsInNvdXJjZXMiOlsiZmlsZS11cGxvYWQvbmdmVXBsb2FkU3RhdHVzLmRpcmVjdGl2ZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLEVBQUUsU0FBUyxFQUFFLFlBQVksRUFBRSxNQUFNLEVBQUUsS0FBSyxFQUFFLE1BQU0sZUFBZSxDQUFDO0FBR3ZFLE1BQU0sT0FBTyxlQUFlO0lBRDVCO1FBRVcsWUFBTyxHQUFVLENBQUMsQ0FBQTtRQUNqQixrQkFBYSxHQUF3QixJQUFJLFlBQVksRUFBRSxDQUFBO0lBY25FLENBQUM7SUFYQyxXQUFXLENBQUUsT0FBTztRQUNsQixJQUFJLE9BQU8sQ0FBQyxTQUFTLElBQUksT0FBTyxDQUFDLFNBQVMsQ0FBQyxZQUFZLEVBQUU7WUFDdkQsTUFBTSxLQUFLLEdBQUcsT0FBTyxDQUFDLFNBQVMsQ0FBQyxZQUFZLENBQUE7WUFDNUMsSUFBSSxLQUFLLENBQUMsTUFBTSxJQUFJLEtBQUssQ0FBQyxLQUFLLEVBQUU7Z0JBQy9CLFVBQVUsQ0FBQyxHQUFFLEVBQUU7b0JBQ2IsSUFBSSxDQUFDLE9BQU8sR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLEdBQUcsR0FBRyxLQUFLLENBQUMsTUFBTSxHQUFHLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQztvQkFDNUQsSUFBSSxDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBRSxDQUFBO2dCQUN6QyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUE7YUFDTjtTQUNGO0lBQ0gsQ0FBQzs7O1lBaEJGLFNBQVMsU0FBQyxFQUFDLFFBQVEsRUFBRSxpQkFBaUIsRUFBQzs7O3NCQUVyQyxLQUFLOzRCQUNMLE1BQU07d0JBQ04sS0FBSyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IERpcmVjdGl2ZSwgRXZlbnRFbWl0dGVyLCBPdXRwdXQsIElucHV0IH0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5cbkBEaXJlY3RpdmUoe3NlbGVjdG9yOiAnbmdmVXBsb2FkU3RhdHVzJ30pXG5leHBvcnQgY2xhc3MgbmdmVXBsb2FkU3RhdHVzIHtcbiAgQElucHV0KCkgcGVyY2VudDpudW1iZXIgPSAwXG4gIEBPdXRwdXQoKSBwZXJjZW50Q2hhbmdlOkV2ZW50RW1pdHRlcjxudW1iZXI+ID0gbmV3IEV2ZW50RW1pdHRlcigpXG4gIEBJbnB1dCgpIGh0dHBFdmVudCAhOiBFdmVudFxuXG4gIG5nT25DaGFuZ2VzKCBjaGFuZ2VzICl7XG4gICAgaWYoIGNoYW5nZXMuaHR0cEV2ZW50ICYmIGNoYW5nZXMuaHR0cEV2ZW50LmN1cnJlbnRWYWx1ZSApe1xuICAgICAgY29uc3QgZXZlbnQgPSBjaGFuZ2VzLmh0dHBFdmVudC5jdXJyZW50VmFsdWVcbiAgICAgIGlmIChldmVudC5sb2FkZWQgJiYgZXZlbnQudG90YWwpIHtcbiAgICAgICAgc2V0VGltZW91dCgoKT0+e1xuICAgICAgICAgIHRoaXMucGVyY2VudCA9IE1hdGgucm91bmQoMTAwICogZXZlbnQubG9hZGVkIC8gZXZlbnQudG90YWwpO1xuICAgICAgICAgIHRoaXMucGVyY2VudENoYW5nZS5lbWl0KCB0aGlzLnBlcmNlbnQgKVxuICAgICAgICB9LCAwKVxuICAgICAgfVxuICAgIH1cbiAgfVxufSJdfQ==