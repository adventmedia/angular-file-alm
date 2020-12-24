import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ngfBackground } from './ngfBackground.directive';
import { ngfDrop } from './ngfDrop.directive';
import { ngf } from './ngf.directive';
import { ngfSelect } from './ngfSelect.directive';
import { ngfUploadStatus } from './ngfUploadStatus.directive';
import { ngfFormData } from './ngfFormData.directive';
import { ngfSrc } from './ngfSrc.directive';
//import{ HttpModule } from '@angular/http';
const declarations = [
    ngfDrop,
    ngfSelect,
    ngfBackground,
    ngfSrc,
    ngfUploadStatus,
    ngfFormData,
    ngf
];
export class ngfModule {
}
ngfModule.decorators = [
    { type: NgModule, args: [{
                imports: [
                    CommonModule
                    //,HttpModule
                ],
                declarations: declarations,
                exports: declarations //[HttpModule, ...declarations]
            },] }
];
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmdmLm1vZHVsZS5qcyIsInNvdXJjZVJvb3QiOiIuLi8uLi9wcm9qZWN0cy9hbmd1bGFyLWZpbGUvc3JjLyIsInNvdXJjZXMiOlsiZmlsZS11cGxvYWQvbmdmLm1vZHVsZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLEVBQUUsWUFBWSxFQUFFLE1BQU0saUJBQWlCLENBQUM7QUFDL0MsT0FBTyxFQUFFLFFBQVEsRUFBRSxNQUFNLGVBQWUsQ0FBQztBQUV6QyxPQUFPLEVBQUUsYUFBYSxFQUFFLE1BQU0sMkJBQTJCLENBQUM7QUFDMUQsT0FBTyxFQUFFLE9BQU8sRUFBRSxNQUFNLHFCQUFxQixDQUFDO0FBQzlDLE9BQU8sRUFBRSxHQUFHLEVBQUUsTUFBTSxpQkFBaUIsQ0FBQztBQUN0QyxPQUFPLEVBQUUsU0FBUyxFQUFFLE1BQU0sdUJBQXVCLENBQUM7QUFDbEQsT0FBTyxFQUFFLGVBQWUsRUFBRSxNQUFNLDZCQUE2QixDQUFDO0FBQzlELE9BQU8sRUFBRSxXQUFXLEVBQUUsTUFBTSx5QkFBeUIsQ0FBQztBQUN0RCxPQUFPLEVBQUUsTUFBTSxFQUFFLE1BQU0sb0JBQW9CLENBQUM7QUFDNUMsNENBQTRDO0FBRTVDLE1BQU0sWUFBWSxHQUFHO0lBQ25CLE9BQU87SUFDUCxTQUFTO0lBQ1QsYUFBYTtJQUNiLE1BQU07SUFDTixlQUFlO0lBQ2YsV0FBVztJQUNYLEdBQUc7Q0FDSixDQUFBO0FBU0UsTUFBTSxPQUFPLFNBQVM7OztZQVB4QixRQUFRLFNBQUM7Z0JBQ1IsT0FBTyxFQUFFO29CQUNQLFlBQVk7b0JBQ1osYUFBYTtpQkFDZDtnQkFDRCxZQUFZLEVBQUUsWUFBWTtnQkFDMUIsT0FBTyxFQUFFLFlBQVksQ0FBQSwrQkFBK0I7YUFDckQiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBDb21tb25Nb2R1bGUgfSBmcm9tICdAYW5ndWxhci9jb21tb24nO1xuaW1wb3J0IHsgTmdNb2R1bGUgfSBmcm9tICdAYW5ndWxhci9jb3JlJztcblxuaW1wb3J0IHsgbmdmQmFja2dyb3VuZCB9IGZyb20gJy4vbmdmQmFja2dyb3VuZC5kaXJlY3RpdmUnO1xuaW1wb3J0IHsgbmdmRHJvcCB9IGZyb20gJy4vbmdmRHJvcC5kaXJlY3RpdmUnO1xuaW1wb3J0IHsgbmdmIH0gZnJvbSAnLi9uZ2YuZGlyZWN0aXZlJztcbmltcG9ydCB7IG5nZlNlbGVjdCB9IGZyb20gJy4vbmdmU2VsZWN0LmRpcmVjdGl2ZSc7XG5pbXBvcnQgeyBuZ2ZVcGxvYWRTdGF0dXMgfSBmcm9tICcuL25nZlVwbG9hZFN0YXR1cy5kaXJlY3RpdmUnO1xuaW1wb3J0IHsgbmdmRm9ybURhdGEgfSBmcm9tICcuL25nZkZvcm1EYXRhLmRpcmVjdGl2ZSc7XG5pbXBvcnQgeyBuZ2ZTcmMgfSBmcm9tICcuL25nZlNyYy5kaXJlY3RpdmUnO1xuLy9pbXBvcnR7IEh0dHBNb2R1bGUgfSBmcm9tICdAYW5ndWxhci9odHRwJztcblxuY29uc3QgZGVjbGFyYXRpb25zID0gW1xuICBuZ2ZEcm9wLFxuICBuZ2ZTZWxlY3QsXG4gIG5nZkJhY2tncm91bmQsXG4gIG5nZlNyYyxcbiAgbmdmVXBsb2FkU3RhdHVzLFxuICBuZ2ZGb3JtRGF0YSxcbiAgbmdmXG5dXG5cbkBOZ01vZHVsZSh7XG4gIGltcG9ydHM6IFtcbiAgICBDb21tb25Nb2R1bGVcbiAgICAvLyxIdHRwTW9kdWxlXG4gIF0sXG4gIGRlY2xhcmF0aW9uczogZGVjbGFyYXRpb25zLFxuICBleHBvcnRzOiBkZWNsYXJhdGlvbnMvL1tIdHRwTW9kdWxlLCAuLi5kZWNsYXJhdGlvbnNdXG59KSBleHBvcnQgY2xhc3MgbmdmTW9kdWxlIHt9Il19