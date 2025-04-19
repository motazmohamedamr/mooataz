import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class MeasurementUnitVmService {
  constructor(private http: HttpClient) {}

  addMeasureUnit(data: any): Observable<boolean> {
    return of(true); 
 
  }}