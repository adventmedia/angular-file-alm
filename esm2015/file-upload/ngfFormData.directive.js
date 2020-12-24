import { IterableDiffers, Directive, EventEmitter, Output, Input } from '@angular/core';
export class ngfFormData {
    constructor(IterableDiffers) {
        this.postName = "file";
        this.FormData = new FormData();
        this.FormDataChange = new EventEmitter();
        this.differ = IterableDiffers.find([]).create();
    }
    ngDoCheck() {
        var changes = this.differ.diff(this.files);
        if (changes) {
            setTimeout(() => this.buildFormData(), 0);
        }
    }
    buildFormData() {
        const isArray = typeof (this.files) === 'object' && this.files.constructor === Array;
        if (isArray) {
            this.FormData = new FormData();
            const files = this.files || [];
            files.forEach(file => this.FormData.append(this.postName, file, this.fileName || file.name));
            this.FormDataChange.emit(this.FormData);
        }
        else {
            delete this.FormData;
        }
    }
}
ngfFormData.decorators = [
    { type: Directive, args: [{ selector: 'ngfFormData' },] }
];
ngfFormData.ctorParameters = () => [
    { type: IterableDiffers }
];
ngfFormData.propDecorators = {
    files: [{ type: Input }],
    postName: [{ type: Input }],
    fileName: [{ type: Input }],
    FormData: [{ type: Input }],
    FormDataChange: [{ type: Output }]
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmdmRm9ybURhdGEuZGlyZWN0aXZlLmpzIiwic291cmNlUm9vdCI6Ii4uLy4uL3Byb2plY3RzL2FuZ3VsYXItZmlsZS9zcmMvIiwic291cmNlcyI6WyJmaWxlLXVwbG9hZC9uZ2ZGb3JtRGF0YS5kaXJlY3RpdmUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxFQUVMLGVBQWUsRUFDZixTQUFTLEVBQUUsWUFBWSxFQUN2QixNQUFNLEVBQUUsS0FBSyxFQUNkLE1BQU0sZUFBZSxDQUFDO0FBR3ZCLE1BQU0sT0FBTyxXQUFXO0lBVXRCLFlBQVksZUFBZ0M7UUFSbkMsYUFBUSxHQUFVLE1BQU0sQ0FBQTtRQUd4QixhQUFRLEdBQVksSUFBSSxRQUFRLEVBQUUsQ0FBQTtRQUNqQyxtQkFBYyxHQUEwQixJQUFJLFlBQVksRUFBRSxDQUFBO1FBS2xFLElBQUksQ0FBQyxNQUFNLEdBQUcsZUFBZSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQyxNQUFNLEVBQUUsQ0FBQTtJQUNqRCxDQUFDO0lBRUQsU0FBUztRQUNQLElBQUksT0FBTyxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFFLElBQUksQ0FBQyxLQUFLLENBQUUsQ0FBQztRQUU3QyxJQUFJLE9BQU8sRUFBRTtZQUNYLFVBQVUsQ0FBQyxHQUFFLEVBQUUsQ0FBQSxJQUFJLENBQUMsYUFBYSxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUE7U0FDeEM7SUFDSCxDQUFDO0lBRUQsYUFBYTtRQUNYLE1BQU0sT0FBTyxHQUFHLE9BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLEtBQUcsUUFBUSxJQUFJLElBQUksQ0FBQyxLQUFLLENBQUMsV0FBVyxLQUFHLEtBQUssQ0FBQTtRQUUvRSxJQUFJLE9BQU8sRUFBRTtZQUNYLElBQUksQ0FBQyxRQUFRLEdBQUcsSUFBSSxRQUFRLEVBQUUsQ0FBQTtZQUM5QixNQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsS0FBSyxJQUFJLEVBQUUsQ0FBQTtZQUM5QixLQUFLLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQSxFQUFFLENBQ2xCLElBQUksQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsSUFBSSxFQUFFLElBQUksQ0FBQyxRQUFRLElBQUUsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUNwRSxDQUFBO1lBQ0QsSUFBSSxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUUsSUFBSSxDQUFDLFFBQVEsQ0FBRSxDQUFBO1NBQzFDO2FBQUk7WUFDSCxPQUFPLElBQUksQ0FBQyxRQUFRLENBQUE7U0FDckI7SUFDSCxDQUFDOzs7WUFwQ0YsU0FBUyxTQUFDLEVBQUMsUUFBUSxFQUFFLGFBQWEsRUFBQzs7O1lBTGxDLGVBQWU7OztvQkFPZCxLQUFLO3VCQUNMLEtBQUs7dUJBQ0wsS0FBSzt1QkFFTCxLQUFLOzZCQUNMLE1BQU0iLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQge1xuICBJdGVyYWJsZURpZmZlcixcbiAgSXRlcmFibGVEaWZmZXJzLFxuICBEaXJlY3RpdmUsIEV2ZW50RW1pdHRlcixcbiAgT3V0cHV0LCBJbnB1dFxufSBmcm9tICdAYW5ndWxhci9jb3JlJztcblxuQERpcmVjdGl2ZSh7c2VsZWN0b3I6ICduZ2ZGb3JtRGF0YSd9KVxuZXhwb3J0IGNsYXNzIG5nZkZvcm1EYXRhIHtcbiAgQElucHV0KCkgZmlsZXMgITogRmlsZVtdXG4gIEBJbnB1dCgpIHBvc3ROYW1lOnN0cmluZyA9IFwiZmlsZVwiXG4gIEBJbnB1dCgpIGZpbGVOYW1lICE6IHN0cmluZy8vZm9yY2UgZmlsZSBuYW1lXG5cbiAgQElucHV0KCkgRm9ybURhdGE6Rm9ybURhdGEgPSBuZXcgRm9ybURhdGEoKVxuICBAT3V0cHV0KCkgRm9ybURhdGFDaGFuZ2U6RXZlbnRFbWl0dGVyPEZvcm1EYXRhPiA9IG5ldyBFdmVudEVtaXR0ZXIoKVxuXG4gIGRpZmZlcjpJdGVyYWJsZURpZmZlcjx7fT5cblxuICBjb25zdHJ1Y3RvcihJdGVyYWJsZURpZmZlcnM6IEl0ZXJhYmxlRGlmZmVycyl7XG4gICAgdGhpcy5kaWZmZXIgPSBJdGVyYWJsZURpZmZlcnMuZmluZChbXSkuY3JlYXRlKClcbiAgfVxuXG4gIG5nRG9DaGVjaygpe1xuICAgIHZhciBjaGFuZ2VzID0gdGhpcy5kaWZmZXIuZGlmZiggdGhpcy5maWxlcyApO1xuXG4gICAgaWYgKGNoYW5nZXMpIHtcbiAgICAgIHNldFRpbWVvdXQoKCk9PnRoaXMuYnVpbGRGb3JtRGF0YSgpLCAwKVxuICAgIH1cbiAgfVxuXG4gIGJ1aWxkRm9ybURhdGEoKXtcbiAgICBjb25zdCBpc0FycmF5ID0gdHlwZW9mKHRoaXMuZmlsZXMpPT09J29iamVjdCcgJiYgdGhpcy5maWxlcy5jb25zdHJ1Y3Rvcj09PUFycmF5XG5cbiAgICBpZiggaXNBcnJheSApe1xuICAgICAgdGhpcy5Gb3JtRGF0YSA9IG5ldyBGb3JtRGF0YSgpXG4gICAgICBjb25zdCBmaWxlcyA9IHRoaXMuZmlsZXMgfHwgW11cbiAgICAgIGZpbGVzLmZvckVhY2goZmlsZT0+XG4gICAgICAgIHRoaXMuRm9ybURhdGEuYXBwZW5kKHRoaXMucG9zdE5hbWUsIGZpbGUsIHRoaXMuZmlsZU5hbWV8fGZpbGUubmFtZSlcbiAgICAgIClcbiAgICAgIHRoaXMuRm9ybURhdGFDaGFuZ2UuZW1pdCggdGhpcy5Gb3JtRGF0YSApXG4gICAgfWVsc2V7XG4gICAgICBkZWxldGUgdGhpcy5Gb3JtRGF0YVxuICAgIH1cbiAgfVxufSJdfQ==