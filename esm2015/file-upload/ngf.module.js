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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmdmLm1vZHVsZS5qcyIsInNvdXJjZVJvb3QiOiIvVXNlcnMvYWNrZXJhcHBsZS9Qcm9qZWN0cy93ZWIvYW5ndWxhci9hbmd1bGFyLWZpbGUvZGV2ZWxvcG1lbnQvcHJvamVjdHMvYW5ndWxhci1maWxlL3NyYy8iLCJzb3VyY2VzIjpbImZpbGUtdXBsb2FkL25nZi5tb2R1bGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxFQUFFLFlBQVksRUFBRSxNQUFNLGlCQUFpQixDQUFDO0FBQy9DLE9BQU8sRUFBRSxRQUFRLEVBQUUsTUFBTSxlQUFlLENBQUM7QUFFekMsT0FBTyxFQUFFLGFBQWEsRUFBRSxNQUFNLDJCQUEyQixDQUFDO0FBQzFELE9BQU8sRUFBRSxPQUFPLEVBQUUsTUFBTSxxQkFBcUIsQ0FBQztBQUM5QyxPQUFPLEVBQUUsR0FBRyxFQUFFLE1BQU0saUJBQWlCLENBQUM7QUFDdEMsT0FBTyxFQUFFLFNBQVMsRUFBRSxNQUFNLHVCQUF1QixDQUFDO0FBQ2xELE9BQU8sRUFBRSxlQUFlLEVBQUUsTUFBTSw2QkFBNkIsQ0FBQztBQUM5RCxPQUFPLEVBQUUsV0FBVyxFQUFFLE1BQU0seUJBQXlCLENBQUM7QUFDdEQsT0FBTyxFQUFFLE1BQU0sRUFBRSxNQUFNLG9CQUFvQixDQUFDO0FBQzVDLDRDQUE0QztBQUU1QyxNQUFNLFlBQVksR0FBRztJQUNuQixPQUFPO0lBQ1AsU0FBUztJQUNULGFBQWE7SUFDYixNQUFNO0lBQ04sZUFBZTtJQUNmLFdBQVc7SUFDWCxHQUFHO0NBQ0osQ0FBQTtBQVNFLE1BQU0sT0FBTyxTQUFTOzs7WUFQeEIsUUFBUSxTQUFDO2dCQUNSLE9BQU8sRUFBRTtvQkFDUCxZQUFZO29CQUNaLGFBQWE7aUJBQ2Q7Z0JBQ0QsWUFBWSxFQUFFLFlBQVk7Z0JBQzFCLE9BQU8sRUFBRSxZQUFZLENBQUEsK0JBQStCO2FBQ3JEIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQ29tbW9uTW9kdWxlIH0gZnJvbSAnQGFuZ3VsYXIvY29tbW9uJztcbmltcG9ydCB7IE5nTW9kdWxlIH0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5cbmltcG9ydCB7IG5nZkJhY2tncm91bmQgfSBmcm9tICcuL25nZkJhY2tncm91bmQuZGlyZWN0aXZlJztcbmltcG9ydCB7IG5nZkRyb3AgfSBmcm9tICcuL25nZkRyb3AuZGlyZWN0aXZlJztcbmltcG9ydCB7IG5nZiB9IGZyb20gJy4vbmdmLmRpcmVjdGl2ZSc7XG5pbXBvcnQgeyBuZ2ZTZWxlY3QgfSBmcm9tICcuL25nZlNlbGVjdC5kaXJlY3RpdmUnO1xuaW1wb3J0IHsgbmdmVXBsb2FkU3RhdHVzIH0gZnJvbSAnLi9uZ2ZVcGxvYWRTdGF0dXMuZGlyZWN0aXZlJztcbmltcG9ydCB7IG5nZkZvcm1EYXRhIH0gZnJvbSAnLi9uZ2ZGb3JtRGF0YS5kaXJlY3RpdmUnO1xuaW1wb3J0IHsgbmdmU3JjIH0gZnJvbSAnLi9uZ2ZTcmMuZGlyZWN0aXZlJztcbi8vaW1wb3J0eyBIdHRwTW9kdWxlIH0gZnJvbSAnQGFuZ3VsYXIvaHR0cCc7XG5cbmNvbnN0IGRlY2xhcmF0aW9ucyA9IFtcbiAgbmdmRHJvcCxcbiAgbmdmU2VsZWN0LFxuICBuZ2ZCYWNrZ3JvdW5kLFxuICBuZ2ZTcmMsXG4gIG5nZlVwbG9hZFN0YXR1cyxcbiAgbmdmRm9ybURhdGEsXG4gIG5nZlxuXVxuXG5ATmdNb2R1bGUoe1xuICBpbXBvcnRzOiBbXG4gICAgQ29tbW9uTW9kdWxlXG4gICAgLy8sSHR0cE1vZHVsZVxuICBdLFxuICBkZWNsYXJhdGlvbnM6IGRlY2xhcmF0aW9ucyxcbiAgZXhwb3J0czogZGVjbGFyYXRpb25zLy9bSHR0cE1vZHVsZSwgLi4uZGVjbGFyYXRpb25zXVxufSkgZXhwb3J0IGNsYXNzIG5nZk1vZHVsZSB7fSJdfQ==