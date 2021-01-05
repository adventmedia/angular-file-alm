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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmdmLm1vZHVsZS5qcyIsInNvdXJjZVJvb3QiOiIuLi8uLi9zcmMvIiwic291cmNlcyI6WyJmaWxlLXVwbG9hZC9uZ2YubW9kdWxlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sRUFBRSxZQUFZLEVBQUUsTUFBTSxpQkFBaUIsQ0FBQztBQUMvQyxPQUFPLEVBQUUsUUFBUSxFQUFFLE1BQU0sZUFBZSxDQUFDO0FBRXpDLE9BQU8sRUFBRSxhQUFhLEVBQUUsTUFBTSwyQkFBMkIsQ0FBQztBQUMxRCxPQUFPLEVBQUUsT0FBTyxFQUFFLE1BQU0scUJBQXFCLENBQUM7QUFDOUMsT0FBTyxFQUFFLEdBQUcsRUFBRSxNQUFNLGlCQUFpQixDQUFDO0FBQ3RDLE9BQU8sRUFBRSxTQUFTLEVBQUUsTUFBTSx1QkFBdUIsQ0FBQztBQUNsRCxPQUFPLEVBQUUsZUFBZSxFQUFFLE1BQU0sNkJBQTZCLENBQUM7QUFDOUQsT0FBTyxFQUFFLFdBQVcsRUFBRSxNQUFNLHlCQUF5QixDQUFDO0FBQ3RELE9BQU8sRUFBRSxNQUFNLEVBQUUsTUFBTSxvQkFBb0IsQ0FBQztBQUM1Qyw0Q0FBNEM7QUFFNUMsTUFBTSxZQUFZLEdBQUc7SUFDbkIsT0FBTztJQUNQLFNBQVM7SUFDVCxhQUFhO0lBQ2IsTUFBTTtJQUNOLGVBQWU7SUFDZixXQUFXO0lBQ1gsR0FBRztDQUNKLENBQUE7QUFTRSxNQUFNLE9BQU8sU0FBUzs7O1lBUHhCLFFBQVEsU0FBQztnQkFDUixPQUFPLEVBQUU7b0JBQ1AsWUFBWTtvQkFDWixhQUFhO2lCQUNkO2dCQUNELFlBQVksRUFBRSxZQUFZO2dCQUMxQixPQUFPLEVBQUUsWUFBWSxDQUFBLCtCQUErQjthQUNyRCIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IENvbW1vbk1vZHVsZSB9IGZyb20gJ0Bhbmd1bGFyL2NvbW1vbic7XG5pbXBvcnQgeyBOZ01vZHVsZSB9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuXG5pbXBvcnQgeyBuZ2ZCYWNrZ3JvdW5kIH0gZnJvbSAnLi9uZ2ZCYWNrZ3JvdW5kLmRpcmVjdGl2ZSc7XG5pbXBvcnQgeyBuZ2ZEcm9wIH0gZnJvbSAnLi9uZ2ZEcm9wLmRpcmVjdGl2ZSc7XG5pbXBvcnQgeyBuZ2YgfSBmcm9tICcuL25nZi5kaXJlY3RpdmUnO1xuaW1wb3J0IHsgbmdmU2VsZWN0IH0gZnJvbSAnLi9uZ2ZTZWxlY3QuZGlyZWN0aXZlJztcbmltcG9ydCB7IG5nZlVwbG9hZFN0YXR1cyB9IGZyb20gJy4vbmdmVXBsb2FkU3RhdHVzLmRpcmVjdGl2ZSc7XG5pbXBvcnQgeyBuZ2ZGb3JtRGF0YSB9IGZyb20gJy4vbmdmRm9ybURhdGEuZGlyZWN0aXZlJztcbmltcG9ydCB7IG5nZlNyYyB9IGZyb20gJy4vbmdmU3JjLmRpcmVjdGl2ZSc7XG4vL2ltcG9ydHsgSHR0cE1vZHVsZSB9IGZyb20gJ0Bhbmd1bGFyL2h0dHAnO1xuXG5jb25zdCBkZWNsYXJhdGlvbnMgPSBbXG4gIG5nZkRyb3AsXG4gIG5nZlNlbGVjdCxcbiAgbmdmQmFja2dyb3VuZCxcbiAgbmdmU3JjLFxuICBuZ2ZVcGxvYWRTdGF0dXMsXG4gIG5nZkZvcm1EYXRhLFxuICBuZ2Zcbl1cblxuQE5nTW9kdWxlKHtcbiAgaW1wb3J0czogW1xuICAgIENvbW1vbk1vZHVsZVxuICAgIC8vLEh0dHBNb2R1bGVcbiAgXSxcbiAgZGVjbGFyYXRpb25zOiBkZWNsYXJhdGlvbnMsXG4gIGV4cG9ydHM6IGRlY2xhcmF0aW9ucy8vW0h0dHBNb2R1bGUsIC4uLmRlY2xhcmF0aW9uc11cbn0pIGV4cG9ydCBjbGFzcyBuZ2ZNb2R1bGUge30iXX0=