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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmdmVXBsb2FkU3RhdHVzLmRpcmVjdGl2ZS5qcyIsInNvdXJjZVJvb3QiOiIuLi8uLi9zcmMvIiwic291cmNlcyI6WyJmaWxlLXVwbG9hZC9uZ2ZVcGxvYWRTdGF0dXMuZGlyZWN0aXZlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sRUFBRSxTQUFTLEVBQUUsWUFBWSxFQUFFLE1BQU0sRUFBRSxLQUFLLEVBQUUsTUFBTSxlQUFlLENBQUM7QUFHdkUsTUFBTSxPQUFPLGVBQWU7SUFENUI7UUFFVyxZQUFPLEdBQVUsQ0FBQyxDQUFBO1FBQ2pCLGtCQUFhLEdBQXdCLElBQUksWUFBWSxFQUFFLENBQUE7SUFjbkUsQ0FBQztJQVhDLFdBQVcsQ0FBRSxPQUFPO1FBQ2xCLElBQUksT0FBTyxDQUFDLFNBQVMsSUFBSSxPQUFPLENBQUMsU0FBUyxDQUFDLFlBQVksRUFBRTtZQUN2RCxNQUFNLEtBQUssR0FBRyxPQUFPLENBQUMsU0FBUyxDQUFDLFlBQVksQ0FBQTtZQUM1QyxJQUFJLEtBQUssQ0FBQyxNQUFNLElBQUksS0FBSyxDQUFDLEtBQUssRUFBRTtnQkFDL0IsVUFBVSxDQUFDLEdBQUUsRUFBRTtvQkFDYixJQUFJLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsR0FBRyxHQUFHLEtBQUssQ0FBQyxNQUFNLEdBQUcsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDO29CQUM1RCxJQUFJLENBQUMsYUFBYSxDQUFDLElBQUksQ0FBRSxJQUFJLENBQUMsT0FBTyxDQUFFLENBQUE7Z0JBQ3pDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQTthQUNOO1NBQ0Y7SUFDSCxDQUFDOzs7WUFoQkYsU0FBUyxTQUFDLEVBQUMsUUFBUSxFQUFFLGlCQUFpQixFQUFDOzs7c0JBRXJDLEtBQUs7NEJBQ0wsTUFBTTt3QkFDTixLQUFLIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgRGlyZWN0aXZlLCBFdmVudEVtaXR0ZXIsIE91dHB1dCwgSW5wdXQgfSBmcm9tICdAYW5ndWxhci9jb3JlJztcblxuQERpcmVjdGl2ZSh7c2VsZWN0b3I6ICduZ2ZVcGxvYWRTdGF0dXMnfSlcbmV4cG9ydCBjbGFzcyBuZ2ZVcGxvYWRTdGF0dXMge1xuICBASW5wdXQoKSBwZXJjZW50Om51bWJlciA9IDBcbiAgQE91dHB1dCgpIHBlcmNlbnRDaGFuZ2U6RXZlbnRFbWl0dGVyPG51bWJlcj4gPSBuZXcgRXZlbnRFbWl0dGVyKClcbiAgQElucHV0KCkgaHR0cEV2ZW50ICE6IEV2ZW50XG5cbiAgbmdPbkNoYW5nZXMoIGNoYW5nZXMgKXtcbiAgICBpZiggY2hhbmdlcy5odHRwRXZlbnQgJiYgY2hhbmdlcy5odHRwRXZlbnQuY3VycmVudFZhbHVlICl7XG4gICAgICBjb25zdCBldmVudCA9IGNoYW5nZXMuaHR0cEV2ZW50LmN1cnJlbnRWYWx1ZVxuICAgICAgaWYgKGV2ZW50LmxvYWRlZCAmJiBldmVudC50b3RhbCkge1xuICAgICAgICBzZXRUaW1lb3V0KCgpPT57XG4gICAgICAgICAgdGhpcy5wZXJjZW50ID0gTWF0aC5yb3VuZCgxMDAgKiBldmVudC5sb2FkZWQgLyBldmVudC50b3RhbCk7XG4gICAgICAgICAgdGhpcy5wZXJjZW50Q2hhbmdlLmVtaXQoIHRoaXMucGVyY2VudCApXG4gICAgICAgIH0sIDApXG4gICAgICB9XG4gICAgfVxuICB9XG59Il19