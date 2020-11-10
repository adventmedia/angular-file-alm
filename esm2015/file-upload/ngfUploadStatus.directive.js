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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmdmVXBsb2FkU3RhdHVzLmRpcmVjdGl2ZS5qcyIsInNvdXJjZVJvb3QiOiIvVXNlcnMvYWNrZXJhcHBsZS9Qcm9qZWN0cy93ZWIvYW5ndWxhci9hbmd1bGFyLWZpbGUvZGV2ZWxvcG1lbnQvcHJvamVjdHMvYW5ndWxhci1maWxlL3NyYy8iLCJzb3VyY2VzIjpbImZpbGUtdXBsb2FkL25nZlVwbG9hZFN0YXR1cy5kaXJlY3RpdmUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxFQUFFLFNBQVMsRUFBRSxZQUFZLEVBQUUsTUFBTSxFQUFFLEtBQUssRUFBRSxNQUFNLGVBQWUsQ0FBQztBQUd2RSxNQUFNLE9BQU8sZUFBZTtJQUQ1QjtRQUVXLFlBQU8sR0FBVSxDQUFDLENBQUE7UUFDakIsa0JBQWEsR0FBd0IsSUFBSSxZQUFZLEVBQUUsQ0FBQTtJQWNuRSxDQUFDO0lBWEMsV0FBVyxDQUFFLE9BQU87UUFDbEIsSUFBSSxPQUFPLENBQUMsU0FBUyxJQUFJLE9BQU8sQ0FBQyxTQUFTLENBQUMsWUFBWSxFQUFFO1lBQ3ZELE1BQU0sS0FBSyxHQUFHLE9BQU8sQ0FBQyxTQUFTLENBQUMsWUFBWSxDQUFBO1lBQzVDLElBQUksS0FBSyxDQUFDLE1BQU0sSUFBSSxLQUFLLENBQUMsS0FBSyxFQUFFO2dCQUMvQixVQUFVLENBQUMsR0FBRSxFQUFFO29CQUNiLElBQUksQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFHLEdBQUcsS0FBSyxDQUFDLE1BQU0sR0FBRyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUM7b0JBQzVELElBQUksQ0FBQyxhQUFhLENBQUMsSUFBSSxDQUFFLElBQUksQ0FBQyxPQUFPLENBQUUsQ0FBQTtnQkFDekMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFBO2FBQ047U0FDRjtJQUNILENBQUM7OztZQWhCRixTQUFTLFNBQUMsRUFBQyxRQUFRLEVBQUUsaUJBQWlCLEVBQUM7OztzQkFFckMsS0FBSzs0QkFDTCxNQUFNO3dCQUNOLEtBQUsiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBEaXJlY3RpdmUsIEV2ZW50RW1pdHRlciwgT3V0cHV0LCBJbnB1dCB9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuXG5ARGlyZWN0aXZlKHtzZWxlY3RvcjogJ25nZlVwbG9hZFN0YXR1cyd9KVxuZXhwb3J0IGNsYXNzIG5nZlVwbG9hZFN0YXR1cyB7XG4gIEBJbnB1dCgpIHBlcmNlbnQ6bnVtYmVyID0gMFxuICBAT3V0cHV0KCkgcGVyY2VudENoYW5nZTpFdmVudEVtaXR0ZXI8bnVtYmVyPiA9IG5ldyBFdmVudEVtaXR0ZXIoKVxuICBASW5wdXQoKSBodHRwRXZlbnQgITogRXZlbnRcblxuICBuZ09uQ2hhbmdlcyggY2hhbmdlcyApe1xuICAgIGlmKCBjaGFuZ2VzLmh0dHBFdmVudCAmJiBjaGFuZ2VzLmh0dHBFdmVudC5jdXJyZW50VmFsdWUgKXtcbiAgICAgIGNvbnN0IGV2ZW50ID0gY2hhbmdlcy5odHRwRXZlbnQuY3VycmVudFZhbHVlXG4gICAgICBpZiAoZXZlbnQubG9hZGVkICYmIGV2ZW50LnRvdGFsKSB7XG4gICAgICAgIHNldFRpbWVvdXQoKCk9PntcbiAgICAgICAgICB0aGlzLnBlcmNlbnQgPSBNYXRoLnJvdW5kKDEwMCAqIGV2ZW50LmxvYWRlZCAvIGV2ZW50LnRvdGFsKTtcbiAgICAgICAgICB0aGlzLnBlcmNlbnRDaGFuZ2UuZW1pdCggdGhpcy5wZXJjZW50IClcbiAgICAgICAgfSwgMClcbiAgICAgIH1cbiAgICB9XG4gIH1cbn0iXX0=